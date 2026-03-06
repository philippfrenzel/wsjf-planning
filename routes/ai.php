<?php

use App\Mcp\Servers\WsjfServer;
use Laravel\Mcp\Facades\Mcp;

Mcp::web('/mcp/wsjf', WsjfServer::class)
    ->middleware(['auth:sanctum']);
