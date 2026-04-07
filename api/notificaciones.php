<?php
include "conexion.php";
header('Content-Type: application/json');

// Listar notificaciones no leídas
$stmt = $conn->prepare("SELECT * FROM notificaciones WHERE leida = 0 ORDER BY fecha DESC LIMIT 10");
$stmt->execute();
$result = $stmt->get_result();
$notifs = [];
while ($row = $result->fetch_assoc()) {
  $notifs[] = $row;
}
echo json_encode($notifs);
?>

