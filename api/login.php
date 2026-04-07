<?php
include "conexion.php";

if (!isset($_POST["correo"])) {
    exit;
}

$correo = $conn->real_escape_string($_POST["correo"]);

$sql = "SELECT * FROM USUARIOS WHERE correo = '$correo'";
$resultado = $conn->query($sql);

if ($resultado->num_rows > 0) {

    $usuario = $resultado->fetch_assoc();

    if ($usuario["rol"] === "admin") {
        echo "admin";
    } else {
        echo "cliente";
    }

} else {

    // SI NO EXISTE → SIEMPRE CLIENTE
    $sqlInsert = "INSERT INTO USUARIOS (correo, rol) VALUES ('$correo', 'cliente')";
    $conn->query($sqlInsert);

    echo "cliente";
}

$conn->close();
?>