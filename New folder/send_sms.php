<?php
/**
 * send_sms.php
 * 
 * Reusable function to send SMS via Twilio REST API.
 * No SDK required — uses plain cURL.
 * 
 * Usage:
 *   require_once __DIR__ . '/send_sms.php';
 *   $result = sendSms('+19195551234', 'Hello from Retired Guy Dog Walking!');
 *   if ($result['success']) { ... }
 */

function sendSms($to, $body, $includeImage = true) {
    $configPath = __DIR__ . '/../data/twilio_config.php';
    
    if (!file_exists($configPath)) {
        return ['success' => false, 'error' => 'Twilio config not found'];
    }
    
    $config = require $configPath;
    
    if (empty($config['enabled'])) {
        return ['success' => false, 'error' => 'SMS not enabled yet', 'pending' => true];
    }
    
    $sid   = $config['account_sid'];
    $token = $config['auth_token'];
    $from  = $config['from_number'];
    
    if (!$sid || !$token || !$from || $sid === 'YOUR_ACCOUNT_SID_HERE') {
        return ['success' => false, 'error' => 'Twilio credentials not configured'];
    }
    
    // Clean up phone number — ensure +1 prefix
    $to = preg_replace('/[^0-9+]/', '', $to);
    if (strlen($to) === 10) $to = '+1' . $to;
    elseif (strlen($to) === 11 && $to[0] === '1') $to = '+' . $to;
    elseif (strpos($to, '+') !== 0) $to = '+' . $to;
    
    $url = "https://api.twilio.com/2010-04-01/Accounts/{$sid}/Messages.json";
    
    $postFields = [
        'To'   => $to,
        'From' => $from,
        'Body' => $body,
    ];
    
    // Attach logo image as MMS (branded message)
    if ($includeImage) {
        $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
        $host = $_SERVER['HTTP_HOST'] ?? ($config['site_domain'] ?? 'retiredguydogwalker.com');
        $postFields['MediaUrl'] = "{$protocol}://{$host}/icon-192.png";
    }
    
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL            => $url,
        CURLOPT_POST           => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 15,
        CURLOPT_USERPWD        => "{$sid}:{$token}",
        CURLOPT_POSTFIELDS     => http_build_query($postFields),
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlErr  = curl_error($ch);
    curl_close($ch);
    
    if ($curlErr) {
        return ['success' => false, 'error' => "cURL error: {$curlErr}"];
    }
    
    $data = json_decode($response, true);
    
    if ($httpCode >= 200 && $httpCode < 300) {
        return ['success' => true, 'sid' => $data['sid'] ?? null];
    } else {
        return ['success' => false, 'error' => $data['message'] ?? "HTTP {$httpCode}", 'code' => $data['code'] ?? null];
    }
}
