<?php

namespace App\Notifications;

use App\Models\TeamInvitation;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TeamInviteNotification extends Notification
{
    use Queueable;

    public function __construct(private readonly TeamInvitation $invitation) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $team = $this->invitation->team->name;

        return (new MailMessage)
            ->subject("Uitnodiging voor {$team} op Revenue OS")
            ->line("Je bent uitgenodigd om lid te worden van het team {$team} op Revenue OS.")
            ->action('Uitnodiging accepteren', $this->invitation->url())
            ->line('Deze link is 7 dagen geldig.');
    }
}
