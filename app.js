document.addEventListener("DOMContentLoaded", () => {
  // --- Auth Elements ---
  const authSection = document.getElementById("auth-section");
  const loginForm = document.getElementById("login-form");
  const registerForm = document.getElementById("register-form");

  // --- Main App Elements ---
  const appSection = document.getElementById("app-section");
  const logoutBtn = document.getElementById("logout-btn");

  // --- Navigation Buttons ---
  const navList = document.getElementById("nav-list");
  const navNew = document.getElementById("nav-new");
  const navEdit = document.getElementById("nav-edit");

  // --- Screens ---
  const listScreen = document.getElementById("list-screen");
  const productScreen = document.getElementById("product-screen");
  const newListScreen = document.getElementById("new-list-screen");
  const editListScreen = document.getElementById("edit-list-screen");

  // "Mis Listas" screen
  const listContainer = document.getElementById("list-container");

  // "Productos" screen
  const productListInfo = document.getElementById("product-list-info");
  const productsContainer = document.getElementById("products-container");
  const newProductForm = document.getElementById("new-product-form");
  const productNameInput = document.getElementById("product-name");

  // "Nueva Lista" screen
  const newListForm = document.getElementById("new-list-form");
  const newListName = document.getElementById("new-list-name");
  const newListDescription = document.getElementById("new-list-description");
  const newListDate = document.getElementById("new-list-date");

  // "Editar Lista" screen
  const editListsContainer = document.getElementById("edit-lists-container");
  const editFormContainer = document.getElementById("edit-form-container");
  const editListForm = document.getElementById("edit-list-form");
  const editListId = document.getElementById("edit-list-id");
  const editListName = document.getElementById("edit-list-name");
  const editListDescription = document.getElementById("edit-list-description");
  const editListDate = document.getElementById("edit-list-date");
  const deleteListBtn = document.getElementById("delete-list-btn");

  // Global state
  let currentUser = JSON.parse(localStorage.getItem("user")) || null;
  let currentList = null; // Will hold the currently selected list (for products, etc.)

  // Helper to switch which screen is visible
  function showScreen(screenName) {
    // Hide all screens first
    listScreen.style.display = "none";
    productScreen.style.display = "none";
    newListScreen.style.display = "none";
    editListScreen.style.display = "none";

    switch (screenName) {
      case "list":
        listScreen.style.display = "block";
        break;
      case "product":
        productScreen.style.display = "block";
        break;
      case "new":
        newListScreen.style.display = "block";
        break;
      case "edit":
        editListScreen.style.display = "block";
        break;
    }
  }

  // Set today's date by default to an <input type="date" />
  function setDefaultDate(input) {
    const today = new Date().toISOString().split("T")[0];
    input.value = today;
  }
  setDefaultDate(newListDate);

  // If user is already logged in, show the app
  if (currentUser) {
    authSection.style.display = "none";
    appSection.style.display = "block";
    showScreen("list");
    loadLists(); // Load "Mis Listas"
  } else {
    // Show auth forms
    authSection.style.display = "block";
    appSection.style.display = "none";
  }

  // --- Auth: Login ---
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const username = document.getElementById("login-username").value.trim();
    const password = document.getElementById("login-password").value.trim();

    fetch("backend.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "login",
        username,
        password,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
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

  // --- Auth: Register ---
  registerForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const username = document.getElementById("register-username").value.trim();
    const password = document.getElementById("register-password").value.trim();

    fetch("backend.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "register",
        username,
        password,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          alert("Registro exitoso. Ahora inicia sesión.");
        } else {
          alert(data.message);
        }
      });
  });

  // --- Logout ---
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("user");
    currentUser = null;
    location.reload();
  });

  // --- Navigation ---
  navList.addEventListener("click", () => {
    showScreen("list");
    loadLists();
  });
  navNew.addEventListener("click", () => {
    showScreen("new");
    newListForm.reset();
    setDefaultDate(newListDate);
  });
  navEdit.addEventListener("click", () => {
    showScreen("edit");
    editListsContainer.innerHTML = "";
    editFormContainer.style.display = "none"; // hide the form until a list is chosen
    loadListsForEditing();
  });

  // -----------------------------------------------------------
  //  1) "Mis Listas" Screen
  // -----------------------------------------------------------
  function loadLists() {
    fetch("backend.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "get_lists",
        user_id: currentUser.id,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        listContainer.innerHTML = "";
        if (data.success) {
          data.lists.forEach((list) => {
            const div = document.createElement("div");
            div.className = "list-item";
            div.textContent = `${list.name} (${list.date})`;

            // Clicking a list here -> show products screen
            div.addEventListener("click", () => {
              currentList = list;
              showScreen("product");
              // Show the read-only info
              displayListInfo(currentList);
              // Load products
              loadProducts(currentList.id);
            });

            listContainer.appendChild(div);
          });
        } else {
          alert(data.message);
        }
      });
  }

  // Helper to display list info above the products
  function displayListInfo(list) {
    productListInfo.innerHTML = `
      <h3>${list.name}</h3>
      <p>${list.description || ""}</p>
      <small>Fecha: ${list.date}</small>
    `;
  }

  // -----------------------------------------------------------
  //  2) "Productos" Screen for the selected list
  // -----------------------------------------------------------
  function loadProducts(list_id) {
    fetch("backend.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "get_products",
        list_id,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        productsContainer.innerHTML = "";
        if (data.success) {
          data.products.forEach((product) => {
            const div = document.createElement("div");
            div.className = "product-item";

            // Name
            const nameSpan = document.createElement("span");
            nameSpan.textContent = product.name;

            // Switch (toggle)
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

            // Actions (edit/delete)
            const actionsDiv = document.createElement("div");
            actionsDiv.className = "product-actions";

            // Edit button
            const editBtn = document.createElement("button");
            editBtn.className = "edit-btn";
            editBtn.textContent = "E";
            editBtn.addEventListener("click", () => {
              const newName = prompt("Nuevo nombre del producto:", product.name);
              if (newName && newName.trim() !== "") {
                updateProductName(product.id, newName.trim());
              }
            });

            // Delete button
            const deleteBtn = document.createElement("button");
            deleteBtn.className = "delete-btn";
            deleteBtn.textContent = "X";
            deleteBtn.addEventListener("click", () => {
              if (confirm("¿Eliminar este producto?")) {
                deleteProduct(product.id);
              }
            });

            actionsDiv.appendChild(editBtn);
            actionsDiv.appendChild(deleteBtn);

            // Assemble
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

  // New product form
  newProductForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!currentList) {
      alert("No hay lista seleccionada.");
      return;
    }
    const name = productNameInput.value.trim();
    if (!name) {
      alert("Nombre de producto requerido.");
      return;
    }

    fetch("backend.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "add_product",
        list_id: currentList.id,
        name,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          newProductForm.reset();
          loadProducts(currentList.id);
        } else {
          alert(data.message);
        }
      });
  });

  // Update product switch
  function updateProductSwitch(product_id, switchVal) {
    fetch("backend.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "toggle_product",
        product_id,
        switch: switchVal,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data.success) {
          alert(data.message);
        }
      });
  }

  // Update product name
  function updateProductName(product_id, newName) {
    fetch("backend.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "update_product",
        product_id,
        name: newName,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          loadProducts(currentList.id);
        } else {
          alert(data.message);
        }
      });
  }

  // Delete product
  function deleteProduct(product_id) {
    fetch("backend.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "delete_product",
        product_id,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          loadProducts(currentList.id);
        } else {
          alert(data.message);
        }
      });
  }

  // -----------------------------------------------------------
  //  3) "Nueva Lista" Screen
  // -----------------------------------------------------------
  newListForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = newListName.value.trim();
    const description = newListDescription.value.trim();
    const date = newListDate.value;

    if (!name || !date) {
      alert("Nombre y fecha son requeridos.");
      return;
    }

    fetch("backend.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create_list",
        user_id: currentUser.id,
        name,
        description,
        date,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
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

  // -----------------------------------------------------------
  //  4) "Editar Lista" Screen (only list fields, no products)
  // -----------------------------------------------------------
  function loadListsForEditing() {
    // Reuse the same "get_lists" from the backend
    fetch("backend.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "get_lists",
        user_id: currentUser.id,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        editListsContainer.innerHTML = "";
        if (data.success) {
          data.lists.forEach((list) => {
            const div = document.createElement("div");
            div.className = "list-item";
            div.textContent = `${list.name} (${list.date})`;

            // Clicking a list -> fill edit form
            div.addEventListener("click", () => {
              currentList = list;
              editFormContainer.style.display = "block";
              // Fill the form
              editListId.value = list.id;
              editListName.value = list.name;
              editListDescription.value = list.description;
              editListDate.value = list.date;
            });

            editListsContainer.appendChild(div);
          });
        } else {
          alert(data.message);
        }
      });
  }

  // Submit Edit List form
  editListForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const list_id = editListId.value;
    const name = editListName.value.trim();
    const description = editListDescription.value.trim();
    const date = editListDate.value;

    if (!name || !date) {
      alert("Nombre y fecha son requeridos.");
      return;
    }

    fetch("backend.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "update_list",
        list_id,
        name,
        description,
        date,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          alert("Lista actualizada correctamente.");
          // Refresh the list of lists for editing
          loadListsForEditing();
        } else {
          alert(data.message);
        }
      });
  });

  // Delete List button
  deleteListBtn.addEventListener("click", () => {
    if (!currentList) {
      alert("No hay lista seleccionada para eliminar.");
      return;
    }
    if (
      confirm(
        "¿Estás seguro de eliminar esta lista? (Se eliminarán todos sus productos)"
      )
    ) {
      fetch("backend.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete_list",
          list_id: currentList.id,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            alert("Lista eliminada correctamente.");
            currentList = null;
            editFormContainer.style.display = "none";
            loadListsForEditing(); // Refresh the list so user sees it's gone
          } else {
            alert(data.message);
          }
        });
    }
  });
});

