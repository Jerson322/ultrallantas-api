<?php
include "conexion.php";
header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
  // Listar promociones activas
  $stmt = $conn->prepare("SELECT * FROM promociones WHERE activa = 1 AND (fecha_fin IS NULL OR fecha_fin > NOW()) ORDER BY fecha_inicio DESC");
  $stmt->execute();
  $result = $stmt->get_result();
  $promos = [];
  while ($row = $result->fetch_assoc()) {
    $promos[] = $row;
  }
  echo json_encode($promos);
  exit;
}

if ($method === 'POST') {
  $input = json_decode(file_get_contents('php://input'), true);
  $tipo = $conn->real_escape_string($input['tipo'] ?? '');
  $target = $conn->real_escape_string(json_encode($input['target'] ?? []));
  $descuento = (float)($input['descuento'] ?? 0);
  
  $stmt = $conn->prepare("INSERT INTO promociones (tipo, target, descuento) VALUES (?, ?, ?)");
  $stmt->bind_param("ssd", $tipo, $target, $descuento);
  
  if ($stmt->execute()) {
    echo json_encode(['success' => true, 'id' => $conn->insert_id]);
  } else {
    http_response_code(500);
    echo json_encode(['error' => 'DB error']);
  }
  exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
?>

