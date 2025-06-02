
document.getElementById("foundForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    await fetch("http://localhost:8000/api/found", {
        method: "POST",
        body: formData
    });
    alert("Objet trouvé déclaré !");
    e.target.reset();
    loadData();
});

document.getElementById("lostForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.target;
    const data = {
        description: form.description.value,
        datetime: form.datetime.value,
        content: form.content.value
    };
    await fetch("http://localhost:8000/api/lost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });
    alert("Objet perdu déclaré !");
    form.reset();
    loadData();
});

async function loadData() {
    const found = await fetch("http://localhost:8000/api/found").then(r => r.json());
    const lost = await fetch("http://localhost:8000/api/lost").then(r => r.json());

    document.getElementById("foundList").innerHTML = found.map(f =>
        \`<div><strong>\${f.description}</strong><br><img src="http://localhost:8000\${f.image_url}" width="100"><br>\${f.datetime}<br>\${f.content}</div><hr>\`
    ).join("");

    document.getElementById("lostList").innerHTML = lost.map(l =>
        \`<div><strong>\${l.description}</strong><br>\${l.datetime}<br>\${l.content}<br>Correspondances : \${l.matches.join(", ")}</div><hr>\`
    ).join("");
}

loadData();
