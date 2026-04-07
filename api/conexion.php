<?php

$host = "localhost";
$usuario = "ultraca4_admin2";
$password = "NYK!NzlbUAzL";
$database = "ultraca4_usuarios";

$conn = new mysqli($host, $usuario, $password, $database);

if ($conn->connect_error) {
    die("Error de conexión: " . $conn->connect_error);
}

?>