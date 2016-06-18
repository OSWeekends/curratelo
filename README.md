# Curratelo

### Ofertas de calidad para programadores de calidad

Portal **OpenSource** con ofertas de empleo de calidad para desarrolladores de calidad mantenido por [Ulises Gascón](https://twitter.com/kom_256) y [Roberto Moriyon](https://www.linkedin.com/in/moriyon)

Contacto Dircto -> [@curratelo_Es en Twitter!](https://twitter.com/curratelo_Es)


### IMPORTANTE

**Estamos con la versión Alpha en la web.**

Mientras tanto... nos encataría que nos contaras que te parece el portal. 

Por supuesto estamos abiertos a mejoras y cambios por parte de la comunidad. **Esto es un proyecto opensource!**

La filosofía de este proyecto es ayudar a los desarrolladores con experiencia a encontrara trabajos que supongan un reto profesional y que destaquen frente a los típicos trabajos de la industria. Si crees que tus ofertas encajan en esta filosofía contactanos e incluiremos tus ofertas en el sistema automatico de publicación de [Curratelo.es](http://curratelo.es)

Por el momento el sistema comparte ofertas de los últimos dias de Betabeers, Stackoverflow, GitHub... y también algunas ofertas que aparecen por Twitter y listas de correo como Madridjs...

Este proyecto paso de idea a versión Alpha en [unos escasos cuatro días](https://twitter.com/kom_256/status/743819144705998848), **¡ayudanos a mejorarlo!**


### Arquitectura

Usamos Nodejs, [Pillarsjs](http://pillarsjs.com/) (con [Scheduled](https://github.com/pillarsjs/scheduled) para las tareas automatizadas), [node-rsj](http://hemanth.github.io/node-rsj/) (para parsear RSS) y Firebase. 

Bootstrap y list.js en el front.


### Instalación y arranque

Necesitas tener configurado Node, NPM y tener una cuenta correctaemnte configurada en Firebase para poder replicar el portal.

- Instalar dependencias:
```
npm install
```

- Arancar
```
node server
```

### Fuentes de Información

**Basadas en RSS**
- [Betabeers](https://betabeers.com/post/feed/)
- [Github](https://jobs.github.com/positions.atom)
- [Stackoverflow](http://stackoverflow.com/jobs/feed) 

y **Google Sheets** en algunos casos

