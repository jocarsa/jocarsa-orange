/* app.js */
document.addEventListener("DOMContentLoaded", () => {
  // Elementos de autenticación
  const authSection = document.getElementById("auth-section");
  const loginForm = document.getElementById("login-form");
  const registerForm = document.getElementById("register-form");

  // Elementos de la App
  const appSection = document.getElementById("app-section");
  const logoutBtn = document.getElementById("logout-btn");

  // Botones del menú de navegación
  const navList = document.getElementById("nav-list");
  const navNew = document.getElementById("nav-new");
  const navEdit = document.getElementById("nav-edit");

  // Pantallas de la aplicación
  const listScreen = document.getElementById("list-screen");
  const newListScreen = document.getElementById("new-list-screen");
  const editListScreen = document.getElementById("edit-list-screen");

  // Elementos de la pantalla "Mis Listas"
  const listContainer = document.getElementById("list-container");

  // Elementos de la pantalla "Nueva Lista"
  const newListForm = document.getElementById("new-list-form");
  const newListName = document.getElementById("new-list-name");
  const newListDescription = document.getElementById("new-list-description");
  const newListDate = document.getElementById("new-list-date");

  // Elementos de la pantalla "Editar Lista"
  const editListForm = document.getElementById("edit-list-form");
  const editListId = document.getElementById("edit-list-id");
  const editListName = document.getElementById("edit-list-name");
  const editListDescription = document.getElementById("edit-list-description");
  const editListDate = document.getElementById("edit-list-date");
  const productsContainer = document.getElementById("products-container");
  const newProductForm = document.getElementById("new-product-form");
  const productNameInput = document.getElementById("product-name");
  const deleteListBtn = document.getElementById("delete-list-btn");

  let currentUser = JSON.parse(localStorage.getItem("user")) || null;
  let currentList = null; // Objeto con los detalles de la lista seleccionada

  // Función para mostrar una pantalla específica
  function showScreen(screen) {
    listScreen.style.display = "none";
    newListScreen.style.display = "none";
    editListScreen.style.display = "none";

    if (screen === "list") {
      listScreen.style.display = "block";
    } else if (screen === "new") {
      newListScreen.style.display = "block";
    } else if (screen === "edit") {
      editListScreen.style.display = "block";
    }
  }

  // Asigna la fecha de hoy por defecto al input de fecha
  function setDefaultDate(input) {
    const today = new Date().toISOString().split("T")[0];
    input.value = today;
  }
  setDefaultDate(newListDate);

  // Si ya hay usuario en sesión, mostramos la app
  if (currentUser) {
    authSection.style.display = "none";
    appSection.style.display = "block";
    showScreen("list");
    loadLists();
  } else {
    authSection.style.display = "block";
    appSection.style.display = "none";
  }

  // Iniciar sesión
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const username = document.getElementById("login-username").value;
    const password = document.getElementById("login-password").value;
    fetch("backend.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "login", username, password })
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        currentUser = { id: data.user.id, username: data.user.username };
        localStorage.setItem("user", JSON.stringify(currentUser));
        authSection.style.display = "none";
        appSection.style.display = "block";
        showScreen("list");
        loadLists();
      } else {
        alert(data.message);
      }
    });
  });

  // Registro de usuario
  registerForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const username = document.getElementById("register-username").value;
    const password = document.getElementById("register-password").value;
    fetch("backend.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "register", username, password })
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        alert("Registro exitoso. Ahora inicia sesión.");
      } else {
        alert(data.message);
      }
    });
  });

  // Cerrar sesión
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("user");
    currentUser = null;
    location.reload();
  });

  // Navegación del menú
  navList.addEventListener("click", () => {
    showScreen("list");
    loadLists();
  });
  navNew.addEventListener("click", () => {
    showScreen("new");
    setDefaultDate(newListDate);
    newListForm.reset();
  });
  navEdit.addEventListener("click", () => {
    if (currentList) {
      showScreen("edit");
    } else {
      alert("Por favor, selecciona una lista desde 'Mis Listas' para editar.");
    }
  });

  // Cargar listas del usuario
  function loadLists() {
    fetch("backend.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "get_lists", user_id: currentUser.id })
    })
    .then(res => res.json())
    .then(data => {
      listContainer.innerHTML = "";
      if (data.success) {
        data.lists.forEach(list => {
          const div = document.createElement("div");
          div.className = "list-item";
          div.textContent = list.name + " (" + list.date + ")";
          // Al hacer clic en una lista se carga la pantalla de edición
          div.addEventListener("click", () => {
            currentList = list;
            editListId.value = list.id;
            editListName.value = list.name;
            editListDescription.value = list.description;
            editListDate.value = list.date;
            showScreen("edit");
            loadProducts(list.id);
          });
          listContainer.appendChild(div);
        });
      } else {
        alert(data.message);
      }
    });
  }

  // Crear nueva lista
  newListForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = newListName.value;
    const description = newListDescription.value;
    const date = newListDate.value;
    fetch("backend.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create_list", user_id: currentUser.id, name, description, date })
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        alert("Lista creada correctamente.");
        newListForm.reset();
        setDefaultDate(newListDate);
        showScreen("list");
        loadLists();
      } else {
        alert(data.message);
      }
    });
  });

  // Editar lista (actualizar datos)
  editListForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const list_id = editListId.value;
    const name = editListName.value;
    const description = editListDescription.value;
    const date = editListDate.value;
    fetch("backend.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update_list", list_id, name, description, date })
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        alert("Lista actualizada correctamente.");
        loadLists();
      } else {
        alert(data.message);
      }
    });
  });

  // Eliminar lista
  deleteListBtn.addEventListener("click", () => {
    if (confirm("¿Estás seguro de eliminar esta lista? Esta acción eliminará también todos sus productos.")) {
      fetch("backend.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete_list", list_id: currentList.id })
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          alert("Lista eliminada correctamente.");
          currentList = null;
          showScreen("list");
          loadLists();
        } else {
          alert(data.message);
        }
      });
    }
  });

  // Cargar productos de una lista
  function loadProducts(list_id) {
    fetch("backend.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "get_products", list_id })
    })
    .then(res => res.json())
    .then(data => {
      productsContainer.innerHTML = "";
      if (data.success) {
        data.products.forEach(product => {
          const div = document.createElement("div");
          div.className = "product-item";
          
          // Nombre del producto
          const nameSpan = document.createElement("span");
          nameSpan.textContent = product.name;
          
          // Interruptor personalizado (switch)
          const switchLabel = document.createElement("label");
          switchLabel.className = "switch";
          const switchInput = document.createElement("input");
          switchInput.type = "checkbox";
          switchInput.checked = product.switch == 1;
          switchInput.addEventListener("change", () => {
            updateProductSwitch(product.id, switchInput.checked ? 1 : 0);
          });
          const sliderSpan = document.createElement("span");
          sliderSpan.className = "slider";
          switchLabel.appendChild(switchInput);
          switchLabel.appendChild(sliderSpan);
          
          // Contenedor para botones de acción en el producto
          const actionsDiv = document.createElement("div");
          actionsDiv.className = "product-actions";
          
          // Botón para editar el nombre del producto
          const editBtn = document.createElement("button");
          editBtn.className = "edit-btn";
          editBtn.textContent = "Editar";
          editBtn.addEventListener("click", () => {
            const newName = prompt("Nuevo nombre del producto:", product.name);
            if (newName && newName.trim() !== "") {
              updateProductName(product.id, newName.trim());
            }
          });
          
          // Botón para eliminar el producto
          const deleteBtn = document.createElement("button");
          deleteBtn.className = "delete-btn";
          deleteBtn.textContent = "Eliminar";
          deleteBtn.addEventListener("click", () => {
            if (confirm("¿Eliminar este producto?")) {
              deleteProduct(product.id);
            }
          });
          
          actionsDiv.appendChild(editBtn);
          actionsDiv.appendChild(deleteBtn);
          
          // Agregar todos los elementos al contenedor del producto
          div.appendChild(nameSpan);
          div.appendChild(switchLabel);
          div.appendChild(actionsDiv);
          productsContainer.appendChild(div);
        });
      } else {
        alert(data.message);
      }
    });
  }

  // Añadir nuevo producto a la lista actual
  newProductForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!currentList) {
      alert("No hay lista seleccionada.");
      return;
    }
    const name = productNameInput.value;
    fetch("backend.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "add_product", list_id: currentList.id, name })
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        newProductForm.reset();
        loadProducts(currentList.id);
      } else {
        alert(data.message);
      }
    });
  });

  // Actualizar estado (switch) del producto
  function updateProductSwitch(product_id, switchVal) {
    fetch("backend.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "toggle_product", product_id, switch: switchVal })
    })
    .then(res => res.json())
    .then(data => {
      if (!data.success) {
        alert(data.message);
      }
    });
  }
  
  // Actualizar el nombre de un producto
  function updateProductName(product_id, newName) {
    fetch("backend.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update_product", product_id, name: newName })
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        loadProducts(currentList.id);
      } else {
        alert(data.message);
      }
    });
  }
  
  // Eliminar un producto
  function deleteProduct(product_id) {
    fetch("backend.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete_product", product_id })
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        loadProducts(currentList.id);
      } else {
        alert(data.message);
      }
    });
  }
});

