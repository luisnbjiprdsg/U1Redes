
document.addEventListener("DOMContentLoaded", () => {
  const $ = id => document.getElementById(id);

  function ipAEntero(ip) {
    const partes = ip.trim().split(".");
    if (partes.length !== 4 || partes.some(p => !/^\d{1,3}$/.test(p) || Number(p) > 255)) {
      throw new Error("Escribe una dirección IPv4 válida, por ejemplo 192.168.1.70.");
    }
    return partes.reduce((n, p) => n * 256 + Number(p), 0);
  }

  function enteroAIp(n) {
    return [Math.floor(n / 16777216) % 256, Math.floor(n / 65536) % 256, Math.floor(n / 256) % 256, n % 256].join(".");
  }

  function mascaraCIDR(prefijo) {
    const bits = prefijo === 0 ? 0 : (0xFFFFFFFF << (32 - prefijo)) >>> 0;
    return enteroAIp(bits);
  }

  // Calculadora 
  for (let p = 0; p <= 32; p++) {
    const opt = document.createElement("option");
    opt.value = p;
    opt.textContent = "/" + p;
    if (p === 26) opt.selected = true;
    $("prefijoRed").appendChild(opt);
  }

  function calcularSubred() {
    const salida = $("resultadoSubred");
    try {
      const ipTexto = $("ipEntrada").value;
      const prefijo = Number($("prefijoRed").value);
      const ip = ipAEntero(ipTexto);
      const tamano = 2 ** (32 - prefijo);
      const red = Math.floor(ip / tamano) * tamano;
      const broadcast = red + tamano - 1;
      let primero, ultimo, hosts, nota = "";

      if (prefijo <= 30) {
        primero = enteroAIp(red + 1);
        ultimo = enteroAIp(broadcast - 1);
        hosts = tamano - 2;
      } else if (prefijo === 31) {
        primero = enteroAIp(red);
        ultimo = enteroAIp(broadcast);
        hosts = 2;
        nota = "En enlaces punto a punto /31, ambas direcciones pueden utilizarse.";
      } else {
        primero = ultimo = enteroAIp(red);
        hosts = 1;
        nota = "/32 identifica una sola dirección.";
      }

      salida.innerHTML = `<h3>Resultado</h3>
        <p><strong>IP ingresada:</strong> ${ipTexto}</p>
        <p><strong>Dirección de red:</strong> ${enteroAIp(red)}/${prefijo}</p>
        <p><strong>Máscara:</strong> ${mascaraCIDR(prefijo)}</p>
        <p><strong>Broadcast:</strong> ${enteroAIp(broadcast)}</p>
        <p><strong>Primer host:</strong> ${primero}</p>
        <p><strong>Último host:</strong> ${ultimo}</p>
        <p><strong>Direcciones totales:</strong> ${tamano}</p>
        <p><strong>Hosts utilizables:</strong> ${hosts}</p>
        ${nota ? `<p class="subtexto">${nota}</p>` : ""}`;
    } catch (e) {
      salida.textContent = e.message;
    }
  }

  $("btnSubred").addEventListener("click", calcularSubred);
  $("ipEntrada").addEventListener("keydown", e => {
    if (e.key === "Enter") calcularSubred();
  });
  $("prefijoRed").addEventListener("change", calcularSubred);
  calcularSubred();

  // Simulador binario y operación AND
  function binario(n) {
    return n.toString(2).padStart(8, "0");
  }

  function actualizarBinario() {
    const ip = Number($("octetoIP").value);
    const mascara = Number($("octetoMascara").value);

    if (![ip, mascara].every(n => Number.isInteger(n) && n >= 0 && n <= 255)) {
      $("resultadoBinario").textContent = "Ingresa números enteros entre 0 y 255.";
      $("interruptores").replaceChildren();
      return;
    }

    const resultado = ip & mascara;
    $("resultadoBinario").innerHTML = `
      <div class="binario-fila"><strong>IP decimal</strong><span>${ip}</span></div>
      <div class="binario-fila"><strong>IP binaria</strong><span class="binario-bits">${binario(ip)}</span></div>
      <div class="binario-fila"><strong>Máscara decimal</strong><span>${mascara}</span></div>
      <div class="binario-fila"><strong>Máscara binaria</strong><span class="binario-bits">${binario(mascara)}</span></div>
      <div class="binario-fila"><strong>Operación AND</strong><span class="binario-bits">${binario(ip)}<br>AND ${binario(mascara)}</span></div>
      <div class="binario-fila"><strong>Resultado AND</strong><span>${resultado} (${binario(resultado)})</span></div>`;

    const controles = $("interruptores");
    controles.replaceChildren();

    for (let bit = 7; bit >= 0; bit--) {
      const b = document.createElement("button");
      const activo = (mascara & (1 << bit)) !== 0;
      b.type = "button";
      b.textContent = activo ? "1" : "0";
      b.classList.toggle("activo", activo);
      b.setAttribute("aria-label", `Alternar bit ${7 - bit}`);
      b.addEventListener("click", () => {
        $("octetoMascara").value = Number($("octetoMascara").value) ^ (1 << bit);
        actualizarBinario();
      });
      controles.appendChild(b);
    }
  }

  $("octetoIP").addEventListener("input", actualizarBinario);
  $("octetoMascara").addEventListener("input", actualizarBinario);
  actualizarBinario();

  const checks = [...document.querySelectorAll(".tema-check")];

  checks.forEach(c => {
    c.checked = localStorage.getItem("netacademy-" + c.value) === "1";
    c.addEventListener("change", () => {
      localStorage.setItem("netacademy-" + c.value, c.checked ? "1" : "0");
      actualizarProgreso();
    });
  });

  function actualizarProgreso() {
    const total = checks.length;
    const hechos = checks.filter(c => c.checked).length;
    $("barraAvance").style.width = (total ? hechos / total * 100 : 0) + "%";
    $("textoAvance").textContent =
      `${hechos} de ${total} temas completados (${Math.round(hechos / total * 100)}%)`;
  }

  actualizarProgreso();

  const preguntas = [
    {q:"¿Cuál es el broadcast de 192.168.1.64/26?",o:["192.168.1.63","192.168.1.127","192.168.1.128","192.168.1.255"],c:1,e:"Un /26 tiene 64 direcciones. El bloque que inicia en .64 termina en .127; esa última dirección es el broadcast."},
    {q:"¿Cuántos hosts utilizables tiene una subred /27 convencional?",o:["14","30","32","62"],c:1,e:"32 − 27 = 5 bits de host. 2⁵ = 32 direcciones; 32 − 2 = 30 hosts utilizables."},
    {q:"¿Qué máscara corresponde al prefijo /24?",o:["255.255.255.128","255.255.255.192","255.255.255.0","255.255.255.224"],c:2,e:"/24 significa 24 bits en uno: 255.255.255.0."},
    {q:"¿Qué técnica permite crear subredes de distintos tamaños?",o:["FLSM","VLSM","Loopback","ARP"],c:1,e:"VLSM permite utilizar diferentes longitudes de prefijo según las necesidades de cada subred."},
    {q:"¿Cuántas direcciones totales tiene una subred /28?",o:["8","14","16","32"],c:2,e:"32 − 28 = 4 bits de host. 2⁴ = 16 direcciones totales; normalmente 14 hosts utilizables."},
    {q:"¿Cuántos bits tiene una dirección IPv4?",o:["16","32","64","128"],c:1,e:"IPv4 utiliza 32 bits divididos en cuatro octetos de 8 bits."},
    {q:"¿Cuál es la red de 192.168.5.77/24?",o:["192.168.5.0","192.168.5.77","192.168.5.255","192.168.0.0"],c:0,e:"Con /24, los primeros tres octetos identifican la red: 192.168.5.0."}
  ];

  let preguntaActual = null;
  let respondida = false;

  function nuevaPregunta() {
    preguntaActual = preguntas[Math.floor(Math.random() * preguntas.length)];
    respondida = false;
    $("preguntaQuiz").textContent = preguntaActual.q;
    $("estadoQuiz").textContent = "";
    $("solucionQuiz").replaceChildren();

    const cont = $("opcionesQuiz");
    cont.replaceChildren();

    preguntaActual.o.forEach((opcion, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = opcion;

      b.addEventListener("click", () => {
        if (respondida) return;
        respondida = true;
        $("estadoQuiz").textContent = i === preguntaActual.c
          ? "¡Correcto! Excelente trabajo."
          : "No es correcto. La respuesta correcta está marcada en verde.";

        [...cont.children].forEach((x, j) => {
          x.disabled = true;
          if (j === preguntaActual.c) x.classList.add("correcta");
          else if (j === i) x.classList.add("incorrecta");
        });
      });

      cont.appendChild(b);
    });
  }

  $("btnNuevaPregunta").addEventListener("click", nuevaPregunta);
  $("btnSolucion").addEventListener("click", () => {
    if (!preguntaActual) nuevaPregunta();
    const out = $("solucionQuiz");
    out.replaceChildren();
    const titulo = document.createElement("strong");
    titulo.textContent = "Respuesta: " + preguntaActual.o[preguntaActual.c];
    const texto = document.createElement("p");
    texto.textContent = preguntaActual.e;
    out.append(titulo, texto);
  });
  nuevaPregunta();

  // Caso práctico de VLSM
  document.querySelectorAll(".respuesta-caso").forEach(b => {
    b.addEventListener("click", () => {
      $("respuestaCaso").textContent = b.dataset.correcta === "true"
        ? "¡Correcto! VLSM permite asignar bloques de tamaños diferentes."
        : "Inténtalo otra vez: busca una técnica que admita máscaras diferentes.";
    });
  });

  $("btnMostrarCaso").addEventListener("click", () => {
    $("solucionCaso").innerHTML = `
      <h3>Solución propuesta</h3>
      <p><strong>Ventas:</strong> 192.168.10.0/26, rango 192.168.10.1–192.168.10.62, broadcast 192.168.10.63.</p>
      <p><strong>TI:</strong> 192.168.10.64/28, rango 192.168.10.65–192.168.10.78, broadcast 192.168.10.79.</p>
      <p><strong>Servidores:</strong> 192.168.10.80/30, rango 192.168.10.81–192.168.10.82, broadcast 192.168.10.83.</p>
      <p>Los bloques no se superponen y caben dentro de 192.168.10.0/24.</p>`;
  });

  // Tabla CIDR /8 a /30
  function filaCIDR(p) {
    const total = 2 ** (32 - p);
    const mascara = mascaraCIDR(p);
    const wildcard = mascara.split(".").map(x => 255 - Number(x)).join(".");
    return `<tr><td>/${p}</td><td>${mascara}</td><td>${wildcard}</td><td>${total.toLocaleString("es-MX")}</td><td>${(total - 2).toLocaleString("es-MX")}</td></tr>`;
  }

  const tbody = $("tablaCIDR").querySelector("tbody");
  for (let p = 8; p <= 30; p++) {
    tbody.insertAdjacentHTML("beforeend", filaCIDR(p));
  }

  function consultarCIDR() {
    const p = Number($("buscarPrefijo").value);

    if (!Number.isInteger(p) || p < 8 || p > 30) {
      $("resultadoTabla").textContent = "Escribe un prefijo entero del /8 al /30.";
      return;
    }

    const total = 2 ** (32 - p);
    const mascara = mascaraCIDR(p);
    const wildcard = mascara.split(".").map(x => 255 - Number(x)).join(".");

    $("resultadoTabla").innerHTML = `
      <p><strong>Prefijo:</strong> /${p}</p>
      <p><strong>Máscara:</strong> ${mascara}</p>
      <p><strong>Wildcard:</strong> ${wildcard}</p>
      <p><strong>Direcciones totales:</strong> ${total.toLocaleString("es-MX")}</p>
      <p><strong>Hosts utilizables habituales:</strong> ${(total - 2).toLocaleString("es-MX")}</p>`;

    const fila = [...tbody.rows].find(r => r.cells[0].textContent === "/" + p);
    if (fila) fila.scrollIntoView({behavior:"smooth", block:"nearest"});
  }

  $("btnTabla").addEventListener("click", consultarCIDR);
  $("buscarPrefijo").addEventListener("keydown", e => {
    if (e.key === "Enter") consultarCIDR();
  });
  consultarCIDR();

  // Copiar comandos de red
  document.querySelectorAll(".copiar").forEach(b => {
    b.addEventListener("click", async () => {
      const texto = b.dataset.copiar;

      try {
        await navigator.clipboard.writeText(texto);
        $("mensajeCopia").textContent = "Comando copiado: " + texto;
      } catch {
        const area = document.createElement("textarea");
        area.value = texto;
        area.style.position = "fixed";
        area.style.opacity = "0";
        document.body.appendChild(area);
        area.select();
        const ok = document.execCommand("copy");
        area.remove();
        $("mensajeCopia").textContent = ok
          ? "Comando copiado: " + texto
          : "No se pudo copiar automáticamente. Selecciona el comando y cópialo manualmente.";
      }

      b.textContent = "¡Copiado!";
      setTimeout(() => b.textContent = "Copiar", 1500);
    });
  });

  // Imprimir o guardar guía como PDF
  $("btnPDF").addEventListener("click", () => window.print());
});