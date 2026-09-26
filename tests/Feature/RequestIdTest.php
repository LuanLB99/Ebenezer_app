<?php

use App\Http\Middleware\AssignRequestId;
use Illuminate\Support\Str;

test('every response carries a generated request id', function () {
    $requestId = $this->get('/up')->headers->get(AssignRequestId::HEADER);

    expect($requestId)->toBeString()
        ->and(Str::isUuid($requestId))->toBeTrue();
});

test('a valid incoming request id is propagated', function () {
    $requestId = (string) Str::uuid();

    $this->get('/up', [AssignRequestId::HEADER => $requestId])
        ->assertHeader(AssignRequestId::HEADER, $requestId);
});

test('an invalid incoming request id is replaced by a new uuid', function () {
    $forged = 'not-a-uuid <script>';

    $requestId = $this->get('/up', [AssignRequestId::HEADER => $forged])
        ->headers->get(AssignRequestId::HEADER);

    expect($requestId)->not->toBe($forged)
        ->and(Str::isUuid($requestId))->toBeTrue();
});
