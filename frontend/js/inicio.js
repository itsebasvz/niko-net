document.addEventListener("DOMContentLoaded", () => {
    alert("El software informa: La sesión ya está activa.");
    
    const formCrearPost = document.getElementById('formCrearPost');
    const muroPosts = document.getElementById('muro-posts'); // Se captura la nueva caja

    // ----------------------------------------------------
    // FUNCIÓN PARA CARGAR Y DIBUJAR LOS POSTS
    // ----------------------------------------------------
    async function cargarPosts() {
        try {
            const response = await fetch('http://localhost:4000/posts');
            const data = await response.json();

            if (data.success) {
                // Se limpia el muro antes de dibujar para no duplicar
                muroPosts.innerHTML = ''; 

                if (data.posts.length === 0) {
                    muroPosts.innerHTML = '<p style="text-align:center; color:#666;">No hay publicaciones aún. ¡Sé el primero en escribir!</p>';
                    return;
                }

                // Se recorre cada post y se crea el diseño en HTML
                data.posts.forEach(post => {
                    // Formateamos la fecha para que se lea mejor
                    const fechaFormateada = new Date(post.created_at).toLocaleString('es-MX', {
                        dateStyle: 'short', timeStyle: 'short'
                    });

                    // Creación de la "tarjeta" del post
                    const postHTML = `
                        <article style="background: white; border: 1px solid #ddd; border-radius: 8px; padding: 15px; margin-bottom: 15px;">
                            <div style="margin-bottom: 10px;">
                                <strong style="font-size: 1.1em; color: #333;">${post.display_name}</strong>
                                <span style="color: #666; font-size: 0.9em;">@${post.username} • ${fechaFormateada}</span>
                            </div>
                            <p style="margin: 0; color: #222; font-size: 1em; line-height: 1.4;">
                                ${post.content}
                            </p>
                        </article>
                    `;
                    
                    // Inyección en el muro
                    muroPosts.innerHTML += postHTML;
                });
            }
        } catch (error) {
            console.error("Error al cargar el muro:", error);
            muroPosts.innerHTML = '<p style="color:red;">Error al cargar las publicaciones.</p>';
        }
    }

    // Ejecución de la función en cuanto se acceda
    cargarPosts();


    // ----------------------------------------------------
    // LÓGICA DE CREACIÓN DE POSTS
    // ----------------------------------------------------
    formCrearPost.addEventListener('submit', async (e) => {
        e.preventDefault();

        const content = document.getElementById('contenidoPost').value;
        const authorId = localStorage.getItem('nikonet_userId');

        if (!authorId) {
            alert("Error de sesión: No se pudo identificar al autor. Por favor, vuelve a iniciar sesión.");
            return;
        }

        try {
            const response = await fetch('http://localhost:4000/crear-post', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ author_id: authorId, content: content })
            });

            const data = await response.json();

            if (response.ok) {
                // Si el post se guardó, se limpia la caja y se recarga el muro
                formCrearPost.reset(); 
                cargarPosts(); 
            } else {
                alert("Atención: " + data.message);
            }
        } catch (error) {
            console.error("Error al publicar:", error);
            alert("No se pudo conectar con el servidor para publicar.");
        }
    });
});