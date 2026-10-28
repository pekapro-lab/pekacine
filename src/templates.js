export const GENRES = ['Ciencia Ficción Cyberpunk', 'Fantasía Épica', 'Thriller', 'Aventura Espacial', 'Documental', 'Anime', 'Noir', 'Comedia']
const S = (title, description, narration, camera = 'static', duration = 6) => ({ title, description, narration, camera, duration })
export const TEMPLATES = {
  'Ciencia Ficción Cyberpunk': { music: 'cyber_pulse', synopsis: 'En una Madrid de 2089 inundada de neón, una hacker descubre que los recuerdos de la ciudad se venden en el mercado negro y decide robar el suyo de vuelta.', scenes: [
    S('Lluvia de neón', 'Plano general de la ciudad de noche, rascacielos con hologramas y lluvia.', 'En 2089, la ciudad ya no duerme. Solo olvida.', 'pan_right', 6),
    S('El encargo', 'La protagonista en un callejón, la cara iluminada por una pantalla.', 'Alguien había vendido mis recuerdos. Y yo iba a recuperarlos.', 'zoom_in', 6),
    S('El asalto', 'Servidores rojos parpadeando, cables, humo.', 'Entrar era fácil. Salir, imposible.', 'dramatic_slow', 8)] },
  'Fantasía Épica': { music: 'epic_strings', synopsis: 'Un joven herrero hereda una espada que canta cuando se acerca la oscuridad, y debe cruzar las montañas antes del eclipse.', scenes: [
    S('El reino', 'Valle verde con un castillo al fondo al amanecer.', 'Hubo un tiempo en que los reinos creían estar a salvo.', 'pan_right', 8),
    S('La espada', 'Primer plano de una espada brillante sobre el yunque.', 'Hasta que la espada volvió a cantar.', 'zoom_in', 6),
    S('El eclipse', 'Un ejército en una colina bajo un sol que se oscurece.', 'Y la oscuridad respondió.', 'dramatic_slow', 8)] },
  Thriller: { music: 'cinematic_ambient', synopsis: 'Una periodista recibe una fotografía de su propio asesinato fechada mañana. Tiene veinticuatro horas para descubrir quién la envió.', scenes: [
    S('El sobre', 'Un sobre sin remite sobre una mesa, luz de lámpara.', 'La foto llegó a las tres de la madrugada.', 'zoom_in', 6),
    S('La ciudad', 'Calle vacía de noche, una figura a lo lejos.', 'Alguien sabía dónde estaría mañana.', 'pan_right', 6),
    S('Cuenta atrás', 'Reloj de pared marcando las doce.', 'Me quedaban veinticuatro horas.', 'dramatic_slow', 6)] },
  'Aventura Espacial': { music: 'epic_strings', synopsis: 'La tripulación de la nave Lumen intercepta una señal desde un planeta que no debería existir.', scenes: [
    S('Despegue', 'Nave atravesando un campo de estrellas.', 'Diario de a bordo, día ciento doce.', 'pan_right', 6),
    S('La señal', 'Puente de mando, pantallas con una onda extraña.', 'La señal se repetía cada siete segundos.', 'zoom_in', 6),
    S('El planeta', 'Un planeta azul con anillos dorados.', 'Y venía de un mundo que no aparecía en ningún mapa.', 'dramatic_slow', 8)] },
  Documental: { music: 'cinematic_ambient', synopsis: 'Un recorrido por la vida de un pueblo de montaña y las personas que lo mantienen vivo.', scenes: [
    S('Amanecer', 'Pueblo de piedra entre montañas con niebla.', 'Cada mañana, el pueblo despierta despacio.', 'pan_right', 8),
    S('Oficios', 'Manos trabajando la madera o el pan.', 'Aquí, los oficios pasan de generación en generación.', 'zoom_in', 6),
    S('Futuro', 'Niños corriendo por la plaza.', 'Y el futuro se escribe con los mismos nombres.', 'static', 6)] },
  Anime: { music: 'cyber_pulse', synopsis: 'Una estudiante descubre que puede detener el tiempo durante diez segundos, justo antes del gran torneo.', scenes: [
    S('El instituto', 'Cerezos en flor delante del instituto.', '¡Hoy todo iba a cambiar!', 'pan_right', 4),
    S('El poder', 'Gotas de lluvia congeladas en el aire.', 'Diez segundos. Solo diez segundos.', 'zoom_in', 6),
    S('El torneo', 'Estadio lleno, la protagonista en el centro.', 'Y pensaba usarlos todos.', 'dramatic_slow', 6)] },
  Noir: { music: 'cinematic_ambient', synopsis: 'Un detective cansado acepta un último caso: encontrar a una cantante que desapareció sin dejar rastro.', scenes: [
    S('La oficina', 'Despacho con persianas, humo y luz dura.', 'Llovía. En esta ciudad siempre llueve.', 'dramatic_slow', 6),
    S('La cliente', 'Silueta de una mujer en la puerta.', 'Entró como entran los problemas: sin llamar.', 'zoom_in', 6),
    S('El club', 'Escenario vacío con un micrófono.', 'La última vez que la vieron, cantaba aquí.', 'pan_right', 8)] },
  Comedia: { music: 'cyber_pulse', synopsis: 'Un gato decide que es el dueño de la casa y empieza a cobrar alquiler a la familia.', scenes: [
    S('El jefe', 'Un gato sentado en un sillón como un rey.', 'Todo empezó el lunes.', 'zoom_in', 4),
    S('El contrato', 'Un papel con huellas de pata.', 'Las condiciones eran claras: atún, dos veces al día.', 'static', 6),
    S('La rebelión', 'La familia escondida detrás del sofá.', 'Nadie esperaba que el perro se uniera a la causa.', 'pan_right', 6)] },
}
