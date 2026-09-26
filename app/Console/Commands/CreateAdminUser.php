<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Validator;

class CreateAdminUser extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:create-admin
                            {--name= : Nome do usuário admin}
                            {--email= : E-mail do usuário admin}
                            {--password= : Senha (mínimo 8 caracteres)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Cria ou garante um usuário administrador do sistema.';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        // 1. Resolver e-mail primeiro para curto-circuitar a idempotência
        $email = $this->option('email') ?? $this->ask('E-mail');

        if (! filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $this->error("E-mail inválido: {$email}");

            return self::FAILURE;
        }

        // 2. Verificar se o usuário já existe
        $existingUser = User::where('email', $email)->first();

        if ($existingUser !== null) {
            if ($existingUser->is_admin) {
                $this->info("O usuário {$email} já é administrador do sistema.");

                return self::SUCCESS;
            }

            $existingUser->is_admin = true;
            $existingUser->save();

            $this->info("O usuário {$email} foi promovido a administrador do sistema.");

            return self::SUCCESS;
        }

        // 3. Novo usuário: coletar nome e senha
        $name = $this->option('name') ?? $this->ask('Nome');

        if ($this->option('password') !== null) {
            $password = $this->option('password');
        } else {
            $password = $this->secret('Senha');
            $confirmation = $this->secret('Confirme a senha');

            if ($password !== $confirmation) {
                $this->error('As senhas não conferem.');

                return self::FAILURE;
            }
        }

        // 4. Validar os dados antes de persistir
        $validator = Validator::make(
            compact('name', 'email', 'password'),
            [
                'name' => ['required', 'string', 'max:255'],
                'email' => ['required', 'email'],
                'password' => ['required', 'min:8'],
            ]
        );

        if ($validator->fails()) {
            foreach ($validator->errors()->all() as $error) {
                $this->error($error);
            }

            return self::FAILURE;
        }

        // 5. Criar o usuário; o cast 'hashed' cuida do hash da senha
        $user = new User;
        $user->name = $name;
        $user->email = $email;
        $user->password = $password;
        $user->is_admin = true;
        $user->save();

        $this->info("Administrador {$email} criado com sucesso.");

        return self::SUCCESS;
    }
}
