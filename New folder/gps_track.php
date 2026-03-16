<?php
/**
 * gps_track.php
 * 
 * Walker's phone sends GPS updates here during a walk.
 * 
 * POST actions:
 *   start    — Begin tracking a walk (creates session + share token)
 *   update   — Add GPS point(s) during walk
 *   stop     — End tracking, calculate final distance
 *   status   — Check current tracking state for a booking
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Credentials: true');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

// Auth check — must be admin
session_start();
if (empty($_SESSION['admin_authenticated'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Admin authentication required', 'authRequired' => true]);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$action = $input['action'] ?? '';
$bookingId = (int)($input['bookingId'] ?? 0);

if (!$bookingId) {
    http_response_code(400);
    echo json_encode(['error' => 'bookingId required']);
    exit;
}

try {
    $dbPath = __DIR__ . '/../data/dogwalker.sqlite';
    $db = new PDO('sqlite:' . $dbPath);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    switch ($action) {

        case 'start':
            // Generate unique share token for customer live view
            $token = bin2hex(random_bytes(16));
            
            $stmt = $db->prepare("INSERT OR REPLACE INTO gps_sessions 
                (booking_id, status, started_at, stopped_at, total_distance_mi, point_count, share_token)
                VALUES (?, 'tracking', datetime('now'), NULL, 0, 0, ?)");
            $stmt->execute([$bookingId, $token]);

            // Clear any old points for this booking (restart)
            $db->prepare("DELETE FROM gps_points WHERE booking_id = ?")->execute([$bookingId]);

            // Build the live tracking URL
            $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
            $host = $_SERVER['HTTP_HOST'] ?? 'retiredguydogwalker.com';
            $liveUrl = "{$protocol}://{$host}/live_track.html?t={$token}";

            // Auto-text the customer the live link
            $smsResult = null;
            $bStmt = $db->prepare("SELECT b.nickname, b.walker_id, c.phone, c.name, c.dogs, w.name AS walker_name FROM bookings b LEFT JOIN customers c ON b.nickname = c.name LEFT JOIN walkers w ON b.walker_id = w.id WHERE b.id = ?");
            $bStmt->execute([$bookingId]);
            $bRow = $bStmt->fetch(PDO::FETCH_ASSOC);

            if ($bRow && !empty($bRow['phone'])) {
                require_once __DIR__ . '/send_sms.php';

                // Format dog name(s)
                $dogNames = array_map('trim', explode(',', $bRow['dogs'] ?? ''));
                $dogNames = array_filter($dogNames);
                if (empty($dogNames)) {
                    $dogStr = $bRow['nickname'] ?: 'Your pup';
                } elseif (count($dogNames) === 1) {
                    $dogStr = $dogNames[0];
                } elseif (count($dogNames) === 2) {
                    $dogStr = $dogNames[0] . ' and ' . $dogNames[1];
                } else {
                    $last = array_pop($dogNames);
                    $dogStr = implode(', ', $dogNames) . ', and ' . $last;
                }

                $walkerName = $bRow['walker_name'] ?: 'Your walker';
                $msg = "🐾 {$walkerName} has started walking {$dogStr}! Watch live: {$liveUrl}";
                $smsResult = sendSms($bRow['phone'], $msg);
            }

            echo json_encode([
                'success' => true,
                'status' => 'tracking',
                'token' => $token,
                'liveUrl' => $liveUrl,
                'smsSent' => $smsResult ? ($smsResult['success'] ?? false) : false,
                'smsError' => $smsResult && !$smsResult['success'] ? ($smsResult['error'] ?? null) : null,
                'smsPending' => $smsResult ? ($smsResult['pending'] ?? false) : false,
            ]);
            break;

        case 'update':
            $points = $input['points'] ?? [];
            if (empty($points)) {
                // Single point mode
                $lat = (float)($input['lat'] ?? 0);
                $lng = (float)($input['lng'] ?? 0);
                $accuracy = (float)($input['accuracy'] ?? 0);
                $ts = $input['timestamp'] ?? date('c');
                if ($lat && $lng) $points = [['lat' => $lat, 'lng' => $lng, 'accuracy' => $accuracy, 'timestamp' => $ts]];
            }

            if (empty($points)) {
                echo json_encode(['error' => 'No GPS points provided']);
                exit;
            }

            $stmt = $db->prepare("INSERT INTO gps_points (booking_id, lat, lng, accuracy, timestamp) VALUES (?, ?, ?, ?, ?)");
            $count = 0;
            foreach ($points as $p) {
                $stmt->execute([
                    $bookingId,
                    (float)($p['lat'] ?? 0),
                    (float)($p['lng'] ?? 0),
                    (float)($p['accuracy'] ?? 0),
                    $p['timestamp'] ?? date('c')
                ]);
                $count++;
            }

            // Update session point count
            $db->prepare("UPDATE gps_sessions SET point_count = point_count + ? WHERE booking_id = ?")
                ->execute([$count, $bookingId]);

            // Calculate running distance
            $distance = calculateDistance($db, $bookingId);
            $db->prepare("UPDATE gps_sessions SET total_distance_mi = ? WHERE booking_id = ?")
                ->execute([$distance, $bookingId]);

            echo json_encode([
                'success' => true,
                'pointsAdded' => $count,
                'totalDistance' => round($distance, 2)
            ]);
            break;

        case 'stop':
            $distance = calculateDistance($db, $bookingId);
            $pointCount = $db->query("SELECT COUNT(*) FROM gps_points WHERE booking_id = {$bookingId}")->fetchColumn();

            $stmt = $db->prepare("UPDATE gps_sessions SET status = 'completed', stopped_at = datetime('now'), total_distance_mi = ?, point_count = ? WHERE booking_id = ?");
            $stmt->execute([$distance, $pointCount, $bookingId]);

            echo json_encode([
                'success' => true,
                'status' => 'completed',
                'totalDistance' => round($distance, 2),
                'pointCount' => (int)$pointCount
            ]);
            break;

        case 'status':
            $stmt = $db->prepare("SELECT * FROM gps_sessions WHERE booking_id = ?");
            $stmt->execute([$bookingId]);
            $session = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$session) {
                echo json_encode(['status' => 'idle', 'bookingId' => $bookingId]);
            } else {
                echo json_encode([
                    'status' => $session['status'],
                    'bookingId' => $bookingId,
                    'token' => $session['share_token'],
                    'totalDistance' => round((float)$session['total_distance_mi'], 2),
                    'pointCount' => (int)$session['point_count'],
                    'startedAt' => $session['started_at'],
                    'stoppedAt' => $session['stopped_at']
                ]);
            }
            break;

        default:
            http_response_code(400);
            echo json_encode(['error' => 'Invalid action. Use: start, update, stop, status']);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}

/**
 * Calculate total distance in miles from GPS points using Haversine formula
 */
function calculateDistance($db, $bookingId) {
    $stmt = $db->prepare("SELECT lat, lng FROM gps_points WHERE booking_id = ? ORDER BY id ASC");
    $stmt->execute([$bookingId]);
    $points = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (count($points) < 2) return 0;

    $totalMiles = 0;
    for ($i = 1; $i < count($points); $i++) {
        $totalMiles += haversine(
            (float)$points[$i-1]['lat'], (float)$points[$i-1]['lng'],
            (float)$points[$i]['lat'],   (float)$points[$i]['lng']
        );
    }
    return $totalMiles;
}

function haversine($lat1, $lon1, $lat2, $lon2) {
    $R = 3958.8; // Earth radius in miles
    $dLat = deg2rad($lat2 - $lat1);
    $dLon = deg2rad($lon2 - $lon1);
    $a = sin($dLat/2) * sin($dLat/2) +
         cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
         sin($dLon/2) * sin($dLon/2);
    $c = 2 * atan2(sqrt($a), sqrt(1-$a));
    return $R * $c;
}
