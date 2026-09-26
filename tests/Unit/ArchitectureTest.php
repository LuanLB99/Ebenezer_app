<?php

/*
|--------------------------------------------------------------------------
| Regras de arquitetura (quality gate)
|--------------------------------------------------------------------------
| Estes testes não verificam comportamento: verificam a ESTRUTURA do código.
| Se um deles falhar, o PR é bloqueado no CI. Ver docs/quality-gates.md.
*/

// Funções de debug (dd, dump, var_dump, die…) e outras práticas ruins de PHP.
arch()->preset()->php();

// Funções perigosas (eval, exec, shell_exec, md5/sha1 para senha, unserialize…).
arch()->preset()->security();

// env() só pode ser lido em config/*.php; fora dali quebra com `config:cache` em produção.
arch('env() is only used inside config files')
    ->expect('env')
    ->not->toBeUsed();

// Acesso a banco passa por Models/serviços, nunca direto na camada HTTP/UI.
arch('controllers do not query the database directly')
    ->expect('App\Http\Controllers')
    ->not->toUse('Illuminate\Support\Facades\DB');

arch('livewire components do not query the database directly')
    ->expect('App\Livewire')
    ->not->toUse('Illuminate\Support\Facades\DB');
