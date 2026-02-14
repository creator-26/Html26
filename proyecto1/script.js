const input = document.getElementById("taskInput");
const list = document.getElementById("taskList");
const sound = document.getElementById("completeSound");
const themeBtn = document.getElementById("themeToggle");

/* ========= GUARDAR ========= */

let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

function saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
}

/* ========= SONIDO SEGURO ========= */

function playSound() {
    if (!sound) return;

    sound.volume = 0.25; // sonido tranquilo
    sound.currentTime = 0;

    // evita error en celulares
    sound.play().catch(() => {});
}

/* ========= MOSTRAR ========= */

function renderTasks() {
    list.innerHTML = "";

    tasks.forEach((task, index) => {
        const li = document.createElement("li");
        li.textContent = task.text;

        if (task.completed) {
            li.classList.add("completed");
        }

        li.onclick = () => {
            tasks[index].completed = !tasks[index].completed;
            playSound(); // 🔊 sonido
            saveTasks();
            renderTasks();
        };

        const del = document.createElement("button");
        del.textContent = "❌";

        del.onclick = (e) => {
            e.stopPropagation();
            tasks.splice(index, 1);
            saveTasks();
            renderTasks();
        };

        li.appendChild(del);
        list.appendChild(li);
    });
}

/* ========= AGREGAR ========= */

function addTask() {
    const text = input.value.trim();
    if (!text) return;

    tasks.push({
        text: text,
        completed: false
    });

    input.value = "";
    saveTasks();
    renderTasks();
}

/* ========= TEMA ========= */

themeBtn.onclick = () => {
    document.body.classList.toggle("dark");
    localStorage.setItem(
        "theme",
        document.body.classList.contains("dark")
    );
};

if (localStorage.getItem("theme") === "true") {
    document.body.classList.add("dark");
}

/* ========= INICIO ========= */

renderTasks();
