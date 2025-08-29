Cualquier cosa pongan cosas aqui

Comandos git

  Configuración Inicial.
    1.
    git config --global user.name “nombre”

    2.
    git config --global user.email email@gmail.com

    3.
    Indicarle a git que vs code es nuestro editor x defecto.
    git config --global core.editor "code --wait"

    4.
    para ver el archivo global. (opcional para checkear que vas bien)
    git config --global -e

    5.
    git config --global core.autocrlf true


  Conectarse a una rama



  Comandos
    Para restaurar todo los archivos a como estaba en el ultimo commit (no incluye carpetas nuevas). Solo afecta archivos ya versionados (trackeados)
      git restore . 

    Para eliminar permanentemente todos los archivos y carpetas no trackeados.
      git clean -fd 




Del codigo

  La carpeta js que se encuentra en public es para poner el css de funcionalidades por ejemplo para crear un navbar requiere js, entonces en el html del layout hacemos referencia al js
  como <script src="/js/sidebar.js" defer></script> es un ejemplo.
