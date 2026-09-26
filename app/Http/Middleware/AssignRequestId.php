<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Context;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

/**
 * Atribui um identificador único a cada requisição.
 *
 * - O id vai para o Context do Laravel, que o anexa automaticamente a todo log
 *   gerado durante a requisição (correlação log ↔ request ↔ erro).
 * - O id volta no header da resposta, para o usuário/suporte informar em caso de erro.
 * - Um id recebido do cliente só é aceito se for um UUID válido; qualquer outro
 *   valor é descartado para impedir injeção de conteúdo arbitrário nos logs.
 */
class AssignRequestId
{
    public const HEADER = 'X-Request-Id';

    public function handle(Request $request, Closure $next): Response
    {
        $incoming = $request->headers->get(self::HEADER);

        $requestId = is_string($incoming) && Str::isUuid($incoming)
            ? $incoming
            : (string) Str::uuid();

        Context::add('request_id', $requestId);

        $response = $next($request);
        $response->headers->set(self::HEADER, $requestId);

        return $response;
    }
}
