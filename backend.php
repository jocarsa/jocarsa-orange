<?php
header("Content-Type: application/json");

// Decodificar la entrada JSON
$input = json_decode(file_get_contents("php://input"), true);
if (!$input || !isset($input['action'])) {
    echo json_encode(["success" => false, "message" => "Acción no especificada."]);
    exit;
}

$action = $input['action'];

// Abrir o crear la base de datos SQLite
$db = new SQLite3('shopping.db');

// Crear las tablas si no existen
$db->exec("CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT
)");

$db->exec("CREATE TABLE IF NOT EXISTS lists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    name TEXT,
    description TEXT,
    date TEXT
)");

$db->exec("CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    list_id INTEGER,
    name TEXT,
    switch INTEGER DEFAULT 0
)");

// Función para hashear contraseñas
function hashPassword($password) {
    return password_hash($password, PASSWORD_DEFAULT);
}

// Manejo de acciones
switch($action) {

    case "register":
        $username = trim($input['username']);
        $password = trim($input['password']);
        if (empty($username) || empty($password)) {
            echo json_encode(["success" => false, "message" => "Usuario y contraseña requeridos."]);
            exit;
        }
        $hashedPassword = hashPassword($password);
        $stmt = $db->prepare("INSERT INTO users (username, password) VALUES (:username, :password)");
        $stmt->bindValue(':username', $username, SQLITE3_TEXT);
        $stmt->bindValue(':password', $hashedPassword, SQLITE3_TEXT);
        $result = @$stmt->execute();
        if ($result) {
            echo json_encode(["success" => true, "message" => "Usuario registrado correctamente."]);
        } else {
            echo json_encode(["success" => false, "message" => "Error al registrar el usuario (posiblemente ya existe)."]);
        }
        break;

    case "login":
        $username = trim($input['username']);
        $password = trim($input['password']);
        if (empty($username) || empty($password)) {
            echo json_encode(["success" => false, "message" => "Usuario y contraseña requeridos."]);
            exit;
        }
        $stmt = $db->prepare("SELECT * FROM users WHERE username = :username");
        $stmt->bindValue(':username', $username, SQLITE3_TEXT);
        $result = $stmt->execute();
        $user = $result->fetchArray(SQLITE3_ASSOC);
        if ($user && password_verify($password, $user['password'])) {
            echo json_encode(["success" => true, "user" => ["id" => $user['id'], "username" => $user['username']]]);
        } else {
            echo json_encode(["success" => false, "message" => "Credenciales incorrectas."]);
        }
        break;

    case "create_list":
        $user_id = intval($input['user_id']);
        $name = trim($input['name']);
        $description = trim($input['description']);
        $date = trim($input['date']);
        if (empty($name) || empty($date)) {
            echo json_encode(["success" => false, "message" => "Nombre y fecha son requeridos."]);
            exit;
        }
        $stmt = $db->prepare("INSERT INTO lists (user_id, name, description, date) VALUES (:user_id, :name, :description, :date)");
        $stmt->bindValue(':user_id', $user_id, SQLITE3_INTEGER);
        $stmt->bindValue(':name', $name, SQLITE3_TEXT);
        $stmt->bindValue(':description', $description, SQLITE3_TEXT);
        $stmt->bindValue(':date', $date, SQLITE3_TEXT);
        $result = $stmt->execute();
        if ($result) {
            echo json_encode(["success" => true, "message" => "Lista creada correctamente."]);
        } else {
            echo json_encode(["success" => false, "message" => "Error al crear la lista."]);
        }
        break;

    case "get_lists":
        $user_id = intval($input['user_id']);
        $stmt = $db->prepare("SELECT * FROM lists WHERE user_id = :user_id ORDER BY date DESC");
        $stmt->bindValue(':user_id', $user_id, SQLITE3_INTEGER);
        $result = $stmt->execute();
        $lists = [];
        while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
            $lists[] = $row;
        }
        echo json_encode(["success" => true, "lists" => $lists]);
        break;

    case "update_list":
        $list_id = intval($input['list_id']);
        $name = trim($input['name']);
        $description = trim($input['description']);
        $date = trim($input['date']);
        if (empty($name) || empty($date)) {
            echo json_encode(["success" => false, "message" => "Nombre y fecha son requeridos."]);
            exit;
        }
        $stmt = $db->prepare("UPDATE lists SET name = :name, description = :description, date = :date WHERE id = :list_id");
        $stmt->bindValue(':name', $name, SQLITE3_TEXT);
        $stmt->bindValue(':description', $description, SQLITE3_TEXT);
        $stmt->bindValue(':date', $date, SQLITE3_TEXT);
        $stmt->bindValue(':list_id', $list_id, SQLITE3_INTEGER);
        $result = $stmt->execute();
        if ($result) {
            echo json_encode(["success" => true, "message" => "Lista actualizada correctamente."]);
        } else {
            echo json_encode(["success" => false, "message" => "Error al actualizar la lista."]);
        }
        break;

    case "delete_list":
        $list_id = intval($input['list_id']);
        // Eliminar todos los productos asociados a la lista
        $db->exec("DELETE FROM products WHERE list_id = $list_id");
        $stmt = $db->prepare("DELETE FROM lists WHERE id = :list_id");
        $stmt->bindValue(':list_id', $list_id, SQLITE3_INTEGER);
        $result = $stmt->execute();
        if ($result) {
            echo json_encode(["success" => true, "message" => "Lista eliminada correctamente."]);
        } else {
            echo json_encode(["success" => false, "message" => "Error al eliminar la lista."]);
        }
        break;

    case "add_product":
        $list_id = intval($input['list_id']);
        $name = trim($input['name']);
        if (empty($name)) {
            echo json_encode(["success" => false, "message" => "Nombre del producto requerido."]);
            exit;
        }
        $stmt = $db->prepare("INSERT INTO products (list_id, name) VALUES (:list_id, :name)");
        $stmt->bindValue(':list_id', $list_id, SQLITE3_INTEGER);
        $stmt->bindValue(':name', $name, SQLITE3_TEXT);
        $result = $stmt->execute();
        if ($result) {
            echo json_encode(["success" => true, "message" => "Producto añadido correctamente."]);
        } else {
            echo json_encode(["success" => false, "message" => "Error al añadir el producto."]);
        }
        break;

    case "get_products":
        $list_id = intval($input['list_id']);
        $stmt = $db->prepare("SELECT * FROM products WHERE list_id = :list_id");
        $stmt->bindValue(':list_id', $list_id, SQLITE3_INTEGER);
        $result = $stmt->execute();
        $products = [];
        while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
            $products[] = $row;
        }
        echo json_encode(["success" => true, "products" => $products]);
        break;

    case "toggle_product":
        $product_id = intval($input['product_id']);
        $switchVal = intval($input['switch']);
        $stmt = $db->prepare("UPDATE products SET switch = :switch WHERE id = :product_id");
        $stmt->bindValue(':switch', $switchVal, SQLITE3_INTEGER);
        $stmt->bindValue(':product_id', $product_id, SQLITE3_INTEGER);
        $result = $stmt->execute();
        if ($result) {
            echo json_encode(["success" => true, "message" => "Producto actualizado."]);
        } else {
            echo json_encode(["success" => false, "message" => "Error al actualizar el producto."]);
        }
        break;
        
    case "update_product":
        $product_id = intval($input['product_id']);
        $name = trim($input['name']);
        if(empty($name)){
            echo json_encode(["success" => false, "message" => "Nombre del producto requerido."]);
            exit;
        }
        $stmt = $db->prepare("UPDATE products SET name = :name WHERE id = :product_id");
        $stmt->bindValue(':name', $name, SQLITE3_TEXT);
        $stmt->bindValue(':product_id', $product_id, SQLITE3_INTEGER);
        $result = $stmt->execute();
        if ($result) {
            echo json_encode(["success" => true, "message" => "Producto actualizado correctamente."]);
        } else {
            echo json_encode(["success" => false, "message" => "Error al actualizar el producto."]);
        }
        break;
        
    case "delete_product":
        $product_id = intval($input['product_id']);
        $stmt = $db->prepare("DELETE FROM products WHERE id = :product_id");
        $stmt->bindValue(':product_id', $product_id, SQLITE3_INTEGER);
        $result = $stmt->execute();
        if ($result) {
            echo json_encode(["success" => true, "message" => "Producto eliminado correctamente."]);
        } else {
            echo json_encode(["success" => false, "message" => "Error al eliminar el producto."]);
        }
        break;

    default:
        echo json_encode(["success" => false, "message" => "Acción no reconocida."]);
        break;
}
?>

