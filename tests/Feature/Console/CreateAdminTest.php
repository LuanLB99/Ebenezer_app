<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;

uses(RefreshDatabase::class);

test('(D8) cria admin quando todas as opcoes sao informadas', function () {
    $this->artisan('app:create-admin', [
        '--name' => 'Admin Teste',
        '--email' => 'admin@example.com',
        '--password' => 'senha12345',
    ])->assertExitCode(0);

    $user = User::where('email', 'admin@example.com')->firstOrFail();

    expect($user->is_admin)->toBeTrue()
        ->and($user->name)->toBe('Admin Teste')
        ->and(Hash::check('senha12345', $user->password))->toBeTrue();
});

test('(D8) cria admin via prompts interativos', function () {
    $this->artisan('app:create-admin')
        ->expectsQuestion('E-mail', 'admin@interativo.com')
        ->expectsQuestion('Nome', 'Admin Interativo')
        ->expectsQuestion('Senha', 'senhainterativa')
        ->expectsQuestion('Confirme a senha', 'senhainterativa')
        ->assertExitCode(0);

    $user = User::where('email', 'admin@interativo.com')->first();

    expect($user)->not->toBeNull()
        ->and($user->is_admin)->toBeTrue();
});

test('(D8) idempotente: rodar duas vezes com o mesmo e-mail nao duplica o usuario', function () {
    $options = [
        '--name' => 'Admin',
        '--email' => 'admin@idempotente.com',
        '--password' => 'senha12345',
    ];

    $this->artisan('app:create-admin', $options)->assertExitCode(0);
    $this->artisan('app:create-admin', ['--email' => 'admin@idempotente.com'])->assertExitCode(0);

    expect(User::where('email', 'admin@idempotente.com')->count())->toBe(1);
});

test('(D8) promove usuario comum a admin sem alterar nome ou senha', function () {
    $user = User::factory()->create([
        'name' => 'Nome Original',
        'email' => 'usuario@example.com',
        'password' => Hash::make('senha-original'),
    ]);

    expect($user->is_admin)->toBeFalse();

    $this->artisan('app:create-admin', [
        '--email' => 'usuario@example.com',
    ])->assertExitCode(0);

    $user->refresh();

    expect($user->is_admin)->toBeTrue()
        ->and($user->name)->toBe('Nome Original')
        ->and(Hash::check('senha-original', $user->password))->toBeTrue();
});

test('(D8) admin ja existente: comando avisa e nao altera nada', function () {
    $user = User::factory()->admin()->create([
        'email' => 'admin@jaexiste.com',
    ]);
    $nomeAntes = $user->name;

    $this->artisan('app:create-admin', [
        '--email' => 'admin@jaexiste.com',
    ])->assertExitCode(0);

    $user->refresh();

    expect($user->is_admin)->toBeTrue()
        ->and($user->name)->toBe($nomeAntes);
});

test('(D8) usuario comum criado pela factory nasce com is_admin false', function () {
    $user = User::factory()->create();

    expect($user->is_admin)->toBeFalse();
});

test('(D8) mass assignment nao consegue setar is_admin true', function () {
    $user = User::create([
        'name' => 'Tentativa',
        'email' => 'massassignment@example.com',
        'password' => 'qualquersenha',
        'is_admin' => true,
    ]);

    expect($user->refresh()->is_admin)->toBeFalse();
});

test('(D8) senha curta e rejeitada e usuario nao e criado', function () {
    $this->artisan('app:create-admin', [
        '--name' => 'Admin',
        '--email' => 'admin@senhafraca.com',
        '--password' => '1234567', // 7 chars — mínimo é 8
    ])->assertExitCode(1);

    expect(User::where('email', 'admin@senhafraca.com')->exists())->toBeFalse();
});
