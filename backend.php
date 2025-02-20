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
$db = new SQLite3('../databases/orange.db');

// Crear las tablas si no existen

// Users: added 'theme' column (default 0)
$db->exec("CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    theme INTEGER DEFAULT 0
)");

// Lists: added 'color' and 'completed' columns (color default white, completed default 0)
$db->exec("CREATE TABLE IF NOT EXISTS lists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    name TEXT,
    description TEXT,
    date TEXT,
    color TEXT,
    completed INTEGER DEFAULT 0
)");

// Products: added 'color' column (default white)
$db->exec("CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    list_id INTEGER,
    name TEXT,
    switch INTEGER DEFAULT 0,
    color TEXT
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
            echo json_encode(["success" => true, "user" => [
                "id" => $user['id'], 
                "username" => $user['username'],
                "theme" => $user['theme']
            ]]);
        } else {
            echo json_encode(["success" => false, "message" => "Credenciales incorrectas."]);
        }
        break;

    case "update_theme":
        $user_id = intval($input['user_id']);
        $theme = intval($input['theme']);
        $stmt = $db->prepare("UPDATE users SET theme = :theme WHERE id = :user_id");
        $stmt->bindValue(':theme', $theme, SQLITE3_INTEGER);
        $stmt->bindValue(':user_id', $user_id, SQLITE3_INTEGER);
        $result = $stmt->execute();
        if ($result) {
            echo json_encode(["success" => true, "message" => "Tema actualizado correctamente."]);
        } else {
            echo json_encode(["success" => false, "message" => "Error al actualizar el tema."]);
        }
        break;

    case "create_list":
        $user_id = intval($input['user_id']);
        $name = trim($input['name']);
        $description = trim($input['description']);
        $date = trim($input['date']);
        $color = isset($input['color']) && trim($input['color']) !== "" ? trim($input['color']) : "#ffffff";
        if (empty($name) || empty($date)) {
            echo json_encode(["success" => false, "message" => "Nombre y fecha son requeridos."]);
            exit;
        }
        $stmt = $db->prepare("INSERT INTO lists (user_id, name, description, date, color) VALUES (:user_id, :name, :description, :date, :color)");
        $stmt->bindValue(':user_id', $user_id, SQLITE3_INTEGER);
        $stmt->bindValue(':name', $name, SQLITE3_TEXT);
        $stmt->bindValue(':description', $description, SQLITE3_TEXT);
        $stmt->bindValue(':date', $date, SQLITE3_TEXT);
        $stmt->bindValue(':color', $color, SQLITE3_TEXT);
        $result = $stmt->execute();
        if ($result) {
            echo json_encode(["success" => true, "message" => "Lista creada correctamente."]);
        } else {
            echo json_encode(["success" => false, "message" => "Error al crear la lista."]);
        }
        break;

    case "get_lists":
        $user_id = intval($input['user_id']);
        // Select lists along with a count of products in each list.
        $stmt = $db->prepare("SELECT l.*, (SELECT COUNT(*) FROM products WHERE list_id = l.id) as product_count 
                              FROM lists l 
                              WHERE user_id = :user_id 
                              ORDER BY completed ASC, date DESC");
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
        $color = isset($input['color']) && trim($input['color']) !== "" ? trim($input['color']) : "#ffffff";
        if (empty($name) || empty($date)) {
            echo json_encode(["success" => false, "message" => "Nombre y fecha son requeridos."]);
            exit;
        }
        $stmt = $db->prepare("UPDATE lists SET name = :name, description = :description, date = :date, color = :color WHERE id = :list_id");
        $stmt->bindValue(':name', $name, SQLITE3_TEXT);
        $stmt->bindValue(':description', $description, SQLITE3_TEXT);
        $stmt->bindValue(':date', $date, SQLITE3_TEXT);
        $stmt->bindValue(':color', $color, SQLITE3_TEXT);
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

    case "toggle_list":
        $list_id = intval($input['list_id']);
        $completed = intval($input['completed']);
        $stmt = $db->prepare("UPDATE lists SET completed = :completed WHERE id = :list_id");
        $stmt->bindValue(':completed', $completed, SQLITE3_INTEGER);
        $stmt->bindValue(':list_id', $list_id, SQLITE3_INTEGER);
        $result = $stmt->execute();
        if ($result) {
            echo json_encode(["success" => true, "message" => "Estado de lista actualizado."]);
        } else {
            echo json_encode(["success" => false, "message" => "Error al actualizar el estado de la lista."]);
        }
        break;

    case "add_product":
        $list_id = intval($input['list_id']);
        $name = trim($input['name']);
        $color = isset($input['color']) && trim($input['color']) !== "" ? trim($input['color']) : "#ffffff";
        if (empty($name)) {
            echo json_encode(["success" => false, "message" => "Nombre del producto requerido."]);
            exit;
        }
        $stmt = $db->prepare("INSERT INTO products (list_id, name, color) VALUES (:list_id, :name, :color)");
        $stmt->bindValue(':list_id', $list_id, SQLITE3_INTEGER);
        $stmt->bindValue(':name', $name, SQLITE3_TEXT);
        $stmt->bindValue(':color', $color, SQLITE3_TEXT);
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
        
    case "update_product_color":
        $product_id = intval($input['product_id']);
        $color = trim($input['color']);
        $stmt = $db->prepare("UPDATE products SET color = :color WHERE id = :product_id");
        $stmt->bindValue(':color', $color, SQLITE3_TEXT);
        $stmt->bindValue(':product_id', $product_id, SQLITE3_INTEGER);
        $result = $stmt->execute();
        if ($result) {
            echo json_encode(["success" => true, "message" => "Color de producto actualizado correctamente."]);
        } else {
            echo json_encode(["success" => false, "message" => "Error al actualizar el color del producto."]);
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

