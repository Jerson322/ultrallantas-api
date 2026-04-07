<?php
include "conexion.php";

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit('POST only');
}

$input = json_decode(file_get_contents('php://input'), true);
$correo = trim($input['correo'] ?? '');
$rol = trim($input['rol'] ?? 'cliente');

if (empty($correo) || !filter_var($correo, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    exit(json_encode(['error' => 'Correo inválido']));
}

if (!in_array($rol, ['admin', 'cliente'])) {
    http_response_code(400);
    exit(json_encode(['error' => 'Rol inválido']));
}

$stmt = $conn->prepare("SELECT id FROM USUARIOS WHERE correo = ?");
$stmt->bind_param("s", $correo);
$stmt->execute();

if ($stmt->get_result()->num_rows > 0) {
    http_response_code(409);
    exit(json_encode(['error' => 'Usuario ya existe']));
}

$stmt = $conn->prepare("INSERT INTO USUARIOS (correo, rol) VALUES (?, ?)");
$stmt->bind_param("ss", $correo, $rol);

if ($stmt->execute()) {
    echo json_encode(['success' => true, 'id' => $conn->insert_id, 'correo' => $correo, 'rol' => $rol]);
} else {
    http_response_code(500);
    echo json_encode(['error' => 'Error DB']);
}

$conn->close();
?>

