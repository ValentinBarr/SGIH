// views/hoteleria/huespedes/modal-new.js
// Retorna la estructura HTML del modal
module.exports = () => {
    return `
    <div class="modal" id="modalNuevoHuesped">
        <div class="modal-background" onclick="document.getElementById('modalNuevoHuesped').classList.remove('is-active')"></div>
        <div class="modal-card">
            <header class="modal-card-head has-background-primary-light">
                <p class="modal-card-title has-text-primary-dark">
                    <span class="icon mr-2"><i class="fas fa-user-plus"></i></span>
                    Registrar Nuevo Huésped
                </p>
                <button class="delete" aria-label="close" onclick="document.getElementById('modalNuevoHuesped').classList.remove('is-active')"></button>
            </header>
            <section class="modal-card-body">
                <div class="notification is-danger is-light" id="errorNuevoHuesped" style="display: none;"></div>

                <form id="formNuevoHuesped" method="POST">
                    <div class="columns">
                        <div class="column">
                            <div class="field">
                                <label class="label">Nombre (*)</label>
                                <input type="text" name="nombre" class="input is-rounded" required>
                            </div>
                        </div>
                        <div class="column">
                            <div class="field">
                                <label class="label">Apellido (*)</label>
                                <input type="text" name="apellido" class="input is-rounded" required>
                            </div>
                        </div>
                    </div>

                    <div class="columns">
                        <div class="column">
                            <div class="field">
                                <label class="label">Documento</label>
                                <input type="text" name="documento" class="input is-rounded">
                            </div>
                        </div>
                        <div class="column">
                            <div class="field">
                                <label class="label">Teléfono</label>
                                <input type="text" name="telefono" class="input is-rounded">
                            </div>
                        </div>
                    </div>
                    
                    <div class="field">
                        <label class="label">Email</label>
                        <input type="email" name="email" class="input is-rounded">
                    </div>

                </form>
            </section>
            <footer class="modal-card-foot">
                <button class="button is-success is-rounded" id="btnGuardarNuevoHuesped">Guardar y Seleccionar</button>
                <button class="button is-light is-rounded" onclick="document.getElementById('modalNuevoHuesped').classList.remove('is-active')">Cancelar</button>
            </footer>
        </div>
    </div>
    `;
};