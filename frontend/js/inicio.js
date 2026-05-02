document.addEventListener("DOMContentLoaded", () => {
    alert("El software informa: La sesión ya está activa.");
    const formCrearPost = document.getElementById('formCrearPost');

    formCrearPost.addEventListener('submit', async (e) => {
        e.preventDefault();

        const content = document.getElementById('contenidoPost').value;
        const authorId = localStorage.getItem('nikonet_userId'); // Leemos quién está usando la app

        if (!authorId) {
            alert("Error de sesión: No se pudo identificar al autor. Por favor, vuelve a iniciar sesión.");
            return;
        }

        try {
            const response = await fetch('http://localhost:4000/crear-post', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json' // Volvemos al clásico JSON
                },
                body: JSON.stringify({ 
                    author_id: authorId, 
                    content: content 
                })
            });

            const data = await response.json();

            if (response.ok) {
                alert(data.message);
                formCrearPost.reset(); // Limpia la caja de texto
            } else {
                alert("Atención: " + data.message);
            }
        } catch (error) {
            console.error("Error al publicar:", error);
            alert("No se pudo conectar con el servidor para publicar.");
        }
    });
});