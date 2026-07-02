<?php

namespace Tests\Feature;

use App\Models\TeamInvitation;
use App\Models\User;
use App\Notifications\TeamInviteNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class TeamInvitationTest extends TestCase
{
    use RefreshDatabase;

    private User $owner;

    protected function setUp(): void
    {
        parent::setUp();
        Notification::fake();
        $this->owner = User::factory()->create();
        Sanctum::actingAs($this->owner);
    }

    public function test_inviting_sends_a_mail_and_returns_a_copyable_link(): void
    {
        $res = $this->postJson('/api/team/invitations', ['email' => 'collega@bedrijf.nl']);

        $res->assertCreated()
            ->assertJsonPath('email', 'collega@bedrijf.nl');
        $this->assertStringContainsString('/invite?token=', $res->json('url'));

        Notification::assertSentOnDemand(TeamInviteNotification::class);
        $this->assertDatabaseHas('team_invitations', ['email' => 'collega@bedrijf.nl', 'team_id' => $this->owner->team_id]);
    }

    public function test_existing_user_emails_cannot_be_invited(): void
    {
        $existing = User::factory()->create();

        $this->postJson('/api/team/invitations', ['email' => $existing->email])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['email']);
    }

    public function test_accepting_joins_the_inviters_team_and_signs_in(): void
    {
        $token = $this->postJson('/api/team/invitations', ['email' => 'nieuw@bedrijf.nl'])->json('url');
        $token = explode('token=', $token)[1];

        $this->app['auth']->forgetGuards();
        $res = $this->postJson("/api/invitations/{$token}/accept", [
            'name' => 'Nieuwe Collega',
            'password' => 'welkomwachtwoord1',
        ]);

        $res->assertCreated()
            ->assertJsonPath('user.team_id', $this->owner->team_id)
            ->assertJsonStructure(['token']);

        // the invite is spent and the pair can't be replayed
        $this->postJson("/api/invitations/{$token}/accept", ['name' => 'X', 'password' => 'nogmaals12345'])
            ->assertNotFound();

        // both users show up in the members list
        $this->app['auth']->forgetGuards();
        Sanctum::actingAs($this->owner);
        $members = collect($this->getJson('/api/team/members')->json('members'))->pluck('email');
        $this->assertTrue($members->contains('nieuw@bedrijf.nl'));
    }

    public function test_expired_invitations_are_invalid(): void
    {
        $token = TeamInvitation::generateToken();
        TeamInvitation::create([
            'team_id' => $this->owner->team_id,
            'email' => 'laat@bedrijf.nl',
            'token' => $token,
            'expires_at' => now()->subDay(),
        ]);

        $this->getJson("/api/invitations/{$token}")->assertNotFound();
        $this->postJson("/api/invitations/{$token}/accept", ['name' => 'X', 'password' => 'telaat1234'])->assertNotFound();
    }

    public function test_invitations_are_team_scoped_for_revocation(): void
    {
        $id = $this->postJson('/api/team/invitations', ['email' => 'weg@bedrijf.nl'])->json('id');

        $other = User::factory()->create();
        $this->app['auth']->forgetGuards();
        Sanctum::actingAs($other);
        $this->deleteJson("/api/team/invitations/{$id}")->assertNotFound();

        $this->app['auth']->forgetGuards();
        Sanctum::actingAs($this->owner);
        $this->deleteJson("/api/team/invitations/{$id}")->assertNoContent();
        $this->assertDatabaseMissing('team_invitations', ['id' => $id]);
    }

    public function test_the_public_show_endpoint_reveals_team_and_email(): void
    {
        $url = $this->postJson('/api/team/invitations', ['email' => 'kijk@bedrijf.nl'])->json('url');
        $token = explode('token=', $url)[1];

        $this->app['auth']->forgetGuards();
        $this->getJson("/api/invitations/{$token}")
            ->assertOk()
            ->assertJsonPath('email', 'kijk@bedrijf.nl')
            ->assertJsonPath('team', $this->owner->team->name);
    }
}
