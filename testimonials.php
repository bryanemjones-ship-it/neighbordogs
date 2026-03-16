<?php
/**
 * testimonials.php — Retired Guy Dog Walker
 * CRUD endpoint for customer testimonials.
 * Stores data in ../data/testimonials.json
 *
 * GET  → returns JSON array of testimonials
 * POST → { action: "add"|"delete", ... }
 */

header('Content-Type: application/json');

$dataFile = __DIR__ . '/../data/testimonials.json';

// ── Helper: read testimonials from JSON file ────────────────
function readTestimonials($file) {
    if (!file_exists($file)) return [];
    $raw = file_get_contents($file);
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

// ── Helper: write testimonials to JSON file ─────────────────
function writeTestimonials($file, $data) {
    $dir = dirname($file);
    if (!is_dir($dir)) mkdir($dir, 0755, true);
    file_put_contents($file, json_encode(array_values($data), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

// ── GET: return all testimonials ────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    echo json_encode(readTestimonials($dataFile));
    exit;
}

// ── POST: add or delete ─────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Check admin session
    session_start();
    if (empty($_SESSION['admin_authenticated'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Not authorized', 'authRequired' => true]);
        exit;
    }

    $input = json_decode(file_get_contents('php://input'), true);
    $action = $input['action'] ?? '';
    $testimonials = readTestimonials($dataFile);

    if ($action === 'add') {
        $name  = trim($input['name']  ?? '');
        $text  = trim($input['text']  ?? '');
        $dogs  = trim($input['dogs']  ?? '');
        $stars = intval($input['stars'] ?? 5);
        $stars = max(1, min(5, $stars));

        if (!$name || !$text) {
            http_response_code(400);
            echo json_encode(['error' => 'Name and text are required.']);
            exit;
        }

        $testimonials[] = [
            'name'  => $name,
            'dogs'  => $dogs,
            'text'  => $text,
            'stars' => $stars
        ];

        writeTestimonials($dataFile, $testimonials);
        echo json_encode(['success' => true]);
        exit;
    }

    if ($action === 'delete') {
        $index = intval($input['index'] ?? -1);
        if ($index < 0 || $index >= count($testimonials)) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid index.']);
            exit;
        }

        array_splice($testimonials, $index, 1);
        writeTestimonials($dataFile, $testimonials);
        echo json_encode(['success' => true]);
        exit;
    }

    http_response_code(400);
    echo json_encode(['error' => 'Invalid action.']);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed.']);
