<?php
include "conexion.php";

header('Content-Type: application/json');

$stmt = $conn->prepare("SELECT correo, rol FROM USUARIOS ORDER BY fecha_registro DESC");
$stmt->execute();
$result = $stmt->get_result();

$usuarios = [];
while ($row = $result->fetch_assoc()) {
  $usuarios[] = $row;
}

echo json_encode($usuarios);
?>

