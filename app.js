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
  const navTheme = document.getElementById("nav-theme");

  // --- Screens ---
  const listScreen = document.getElementById("list-screen");
  const productScreen = document.getElementById("product-screen");
  const newListScreen = document.getElementById("new-list-screen");
  const editListScreen = document.getElementById("edit-list-screen");
  const themeScreen = document.getElementById("theme-screen");

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
  const newListColor = document.getElementById("new-list-color");
  const newListDate = document.getElementById("new-list-date");

  // "Editar Lista" screen
  const editListsContainer = document.getElementById("edit-lists-container");
  const editFormContainer = document.getElementById("edit-form-container");
  const editListForm = document.getElementById("edit-list-form");
  const editListId = document.getElementById("edit-list-id");
  const editListName = document.getElementById("edit-list-name");
  const editListDescription = document.getElementById("edit-list-description");
  const editListColor = document.getElementById("edit-list-color");
  const editListDate = document.getElementById("edit-list-date");
  const deleteListBtn = document.getElementById("delete-list-btn");

  // Global state
  let currentUser = JSON.parse(localStorage.getItem("user")) || null;
  let currentList = null;

  // Helper to switch screens
  function showScreen(screenName) {
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

  // Set today's date for date inputs
  function setDefaultDate(input) {
    const today = new Date().toISOString().split("T")[0];
    input.value = today;
  }
  setDefaultDate(newListDate);

  // If already logged in, apply saved theme
  if (currentUser) {
    authSection.style.display = "none";
    appSection.style.display = "block";
    if (currentUser.theme) {
      appSection.style.filter = `hue-rotate(${currentUser.theme}deg)`;
    }
    showScreen("list");
    loadLists();
  } else {
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
      body: JSON.stringify({ action: "login", username, password }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          currentUser = { 
            id: data.user.id, 
            username: data.user.username,
            theme: data.user.theme
          };
          localStorage.setItem("user", JSON.stringify(currentUser));
          authSection.style.display = "none";
          appSection.style.display = "block";
          if (currentUser.theme) {
            appSection.style.filter = `hue-rotate(${currentUser.theme}deg)`;
          }
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
      body: JSON.stringify({ action: "register", username, password }),
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
    editFormContainer.style.display = "none";
    loadListsForEditing();
  });

  // --- Theming Screen ---
  navTheme.addEventListener("click", () => {
    themeScreen.style.display = themeScreen.style.display === "none" ? "block" : "none";
  });
  document.querySelectorAll(".theme-option").forEach(option => {
    option.addEventListener("click", () => {
      const hue = option.getAttribute("data-hue");
      appSection.style.filter = `hue-rotate(${hue}deg)`;
      themeScreen.style.display = "none";
      updateTheme(hue);
    });
  });

  // Update theme setting for current user
  function updateTheme(themeValue) {
    fetch("backend.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "update_theme",
        user_id: currentUser.id,
        theme: themeValue
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          currentUser.theme = themeValue;
          localStorage.setItem("user", JSON.stringify(currentUser));
        } else {
          alert(data.message);
        }
      });
  }

  // -----------------------------------------------------------
  //  "Mis Listas" Screen
  // -----------------------------------------------------------
  function loadLists() {
    fetch("backend.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "get_lists", user_id: currentUser.id }),
    })
      .then((res) => res.json())
      .then((data) => {
        listContainer.innerHTML = "";
        if (data.success) {
          data.lists.forEach((list) => {
            // Create a container for list item
            const div = document.createElement("div");
            div.className = "list-item";
            // Apply list background color
            div.style.backgroundColor = list.color ? list.color : "#ffffff";

            // Create an inner container for list info and count
            const infoDiv = document.createElement("div");
            infoDiv.className = "list-info";
            // List name and date
            const textSpan = document.createElement("span");
            textSpan.textContent = `${list.name} (${list.date})`;
            // Product count badge
            const countSpan = document.createElement("span");
            countSpan.textContent = list.product_count ? list.product_count : "0";
            countSpan.className = "list-count";

            infoDiv.appendChild(textSpan);
            infoDiv.appendChild(countSpan);

            // Completion switch for list
            const compLabel = document.createElement("label");
            compLabel.className = "list-switch";
            const compInput = document.createElement("input");
            compInput.type = "checkbox";
            compInput.checked = list.completed == 1;
            compInput.addEventListener("click", (e) => {
              // Prevent click from triggering the list selection event
              e.stopPropagation();
            });
            compInput.addEventListener("change", () => {
              updateListCompletion(list.id, compInput.checked ? 1 : 0);
              // Reload lists after a short delay to update ordering
              setTimeout(loadLists, 300);
            });
            const compSlider = document.createElement("span");
            compSlider.className = "slider";
            compLabel.appendChild(compInput);
            compLabel.appendChild(compSlider);

            // Assemble list item: clicking infoDiv opens the list
            infoDiv.addEventListener("click", () => {
              currentList = list;
              showScreen("product");
              displayListInfo(currentList);
              loadProducts(currentList.id);
            });
            div.appendChild(infoDiv);
            div.appendChild(compLabel);

            listContainer.appendChild(div);
          });
        } else {
          alert(data.message);
        }
      });
  }

  // Display list info above products
  function displayListInfo(list) {
    productListInfo.innerHTML = `
      <h3>${list.name}</h3>
      <p>${list.description || ""}</p>
      <small>Fecha: ${list.date}</small>
    `;
  }

  // -----------------------------------------------------------
  //  "Productos" Screen
  // -----------------------------------------------------------
  function loadProducts(list_id) {
    fetch("backend.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "get_products", list_id }),
    })
      .then((res) => res.json())
      .then((data) => {
        productsContainer.innerHTML = "";
        if (data.success) {
          // Sort: not bought (switch=0) first, then done (switch=1)
          data.products.sort((a, b) => a.switch - b.switch);
          data.products.forEach((product) => {
            const div = document.createElement("div");
            div.className = "product-item";
            // Use provided product color (default to white)
            const prodColor = product.color && product.color.trim() !== "" ? product.color : "#ffffff";
            div.style.backgroundColor = prodColor;
            
            // Add a small color-picker at top left for changing product color
            const prodColorPicker = document.createElement("input");
            prodColorPicker.type = "color";
            prodColorPicker.value = prodColor;
            prodColorPicker.style.width = "20px";
            prodColorPicker.style.height = "20px";
            prodColorPicker.style.border = "none";
            prodColorPicker.style.marginRight = "5px";
            prodColorPicker.addEventListener("change", () => {
              const newColor = prodColorPicker.value;
              // Immediately update this product's background color
              div.style.backgroundColor = newColor;
              updateProductColor(product.id, newColor);
            });
            div.insertBefore(prodColorPicker, div.firstChild);
            
            // Product Name
            const nameSpan = document.createElement("span");
            nameSpan.textContent = product.name;
            
            // Switch (toggle) for product completion
            const switchLabel = document.createElement("label");
            switchLabel.className = "switch";
            const switchInput = document.createElement("input");
            switchInput.type = "checkbox";
            switchInput.checked = product.switch == 1;
            switchInput.addEventListener("change", () => {
              updateProductSwitch(product.id, switchInput.checked ? 1 : 0);
              setTimeout(() => loadProducts(currentList.id), 300);
            });
            const sliderSpan = document.createElement("span");
            sliderSpan.className = "slider";
            switchLabel.appendChild(switchInput);
            switchLabel.appendChild(sliderSpan);
            
            // Actions (edit/delete)
            const actionsDiv = document.createElement("div");
            actionsDiv.className = "product-actions";
            const editBtn = document.createElement("button");
            editBtn.className = "edit-btn";
            editBtn.textContent = "E";
            editBtn.addEventListener("click", () => {
              const newName = prompt("Nuevo nombre del producto:", product.name);
              if (newName && newName.trim() !== "") {
                updateProductName(product.id, newName.trim());
              }
            });
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
            
            // Assemble product div
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

  // New product form submission
  newProductForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!currentList) {
      alert("No hay lista seleccionada.");
      return;
    }
    const name = productNameInput.value.trim();
    const colorInput = document.getElementById("product-color");
    const color = colorInput.value; // default is white (#ffffff)
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
        color
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

  // Update product color (new action)
  function updateProductColor(product_id, newColor) {
    fetch("backend.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "update_product_color",
        product_id,
        color: newColor,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data.success) {
          alert(data.message);
        }
      });
  }

  // Delete product
  function deleteProduct(product_id) {
    fetch("backend.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete_product", product_id }),
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
  //  "Nueva Lista" Screen
  // -----------------------------------------------------------
  newListForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = newListName.value.trim();
    const description = newListDescription.value.trim();
    const color = newListColor.value; // list color (default white)
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
        color,
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
  //  "Editar Lista" Screen
  // -----------------------------------------------------------
  function loadListsForEditing() {
    fetch("backend.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "get_lists", user_id: currentUser.id }),
    })
      .then((res) => res.json())
      .then((data) => {
        editListsContainer.innerHTML = "";
        if (data.success) {
          data.lists.forEach((list) => {
            const div = document.createElement("div");
            div.className = "list-item";
            div.textContent = `${list.name} (${list.date})`;
            div.addEventListener("click", () => {
              currentList = list;
              editFormContainer.style.display = "block";
              editListId.value = list.id;
              editListName.value = list.name;
              editListDescription.value = list.description;
              editListColor.value = list.color && list.color.trim() !== "" ? list.color : "#ffffff";
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
    const color = editListColor.value; // list color from edit form
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
        color,
        date,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          alert("Lista actualizada correctamente.");
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
    if (confirm("¿Estás seguro de eliminar esta lista? (Se eliminarán todos sus productos)")) {
      fetch("backend.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete_list", list_id: currentList.id }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            alert("Lista eliminada correctamente.");
            currentList = null;
            editFormContainer.style.display = "none";
            loadListsForEditing();
          } else {
            alert(data.message);
          }
        });
    }
  });

  // Update list completion status
  function updateListCompletion(list_id, completed) {
    fetch("backend.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "toggle_list",
        list_id,
        completed
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data.success) {
          alert(data.message);
        }
      });
  }
});

