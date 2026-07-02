<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SettingsTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create(['email' => 'ik@bedrijf.test']);
        Sanctum::actingAs($this->user);
    }

    public function test_profile_can_be_updated(): void
    {
        $this->patchJson('/api/settings/profile', ['name' => 'Nieuwe Naam', 'email' => 'nieuw@bedrijf.test'])
            ->assertOk()
            ->assertJsonPath('name', 'Nieuwe Naam')
            ->assertJsonPath('email', 'nieuw@bedrijf.test')
            ->assertJsonStructure(['team' => ['id', 'name']]);

        $this->assertDatabaseHas('users', ['id' => $this->user->id, 'email' => 'nieuw@bedrijf.test']);
    }

    public function test_profile_email_must_be_unique_but_own_email_is_allowed(): void
    {
        User::factory()->create(['email' => 'bezet@x.test']);

        $this->patchJson('/api/settings/profile', ['name' => 'X', 'email' => 'bezet@x.test'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['email']);

        // keeping your own email is not a "duplicate"
        $this->patchJson('/api/settings/profile', ['name' => 'X', 'email' => 'ik@bedrijf.test'])->assertOk();
    }

    public function test_password_change_requires_the_current_password(): void
    {
        $this->putJson('/api/settings/password', [
            'current_password' => 'fout-wachtwoord',
            'password' => 'nieuwwachtwoord1',
            'password_confirmation' => 'nieuwwachtwoord1',
        ])->assertUnprocessable()->assertJsonValidationErrors(['current_password']);
    }

    public function test_password_change_works_and_revokes_other_tokens(): void
    {
        $other = $this->user->createToken('other-device');
        $current = $this->user->createToken('spa');
        // act via the freshly issued "current" token so revocation can spare it
        $this->app['auth']->forgetGuards();

        $headers = ['Authorization' => 'Bearer '.$current->plainTextToken];
        $this->putJson('/api/settings/password', [
            'current_password' => 'password',
            'password' => 'nieuwwachtwoord1',
            'password_confirmation' => 'nieuwwachtwoord1',
        ], $headers)->assertNoContent();

        // old password no longer works, new one does
        $this->postJson('/api/login', ['email' => 'ik@bedrijf.test', 'password' => 'password'])->assertUnprocessable();
        $this->postJson('/api/login', ['email' => 'ik@bedrijf.test', 'password' => 'nieuwwachtwoord1'])->assertOk();

        // the other device's token is gone, the current one survived
        $this->assertDatabaseMissing('personal_access_tokens', ['id' => $other->accessToken->id]);
        $this->assertDatabaseHas('personal_access_tokens', ['id' => $current->accessToken->id]);
    }

    public function test_team_can_be_renamed(): void
    {
        $this->patchJson('/api/settings/team', ['name' => 'Mijn Bedrijf BV'])
            ->assertOk()
            ->assertJsonPath('team.name', 'Mijn Bedrijf BV');

        $this->assertDatabaseHas('teams', ['id' => $this->user->team_id, 'name' => 'Mijn Bedrijf BV']);
    }
}
