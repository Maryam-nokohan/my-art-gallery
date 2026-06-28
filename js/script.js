const artworksPool = [
  { src: "./arts/angelsdeath.jpg", title: "Lost Wings" },
  { src: "./arts/city1.jpg", title: "Fantasy City" },
  { src: "./arts/city3.png", title: "City Lights" },
  { src: "./arts/city22.jpg", title: "Fantasy City Mirror" },
  { src: "arts/fallenAngle.jpg", title: "Fallen Angel" },
  { src: "arts/Prisoner.jpg", title: "Prisoner" },
  { src: "./arts/witch.jpg", title: "The Witch" },
  { src: "./arts/white.jpg", title: "Moon Light" },
  { src: "./arts/sheeps.jpg", title: "The Train" },
];

let scene, camera, renderer;
let clickableObjects = [];
let currentRoomIndex = 0;

let targetCameraX = 0;
const isMobile = window.innerWidth < 768;
const roomSpacingX = isMobile ? 24 : 35;
let wallMat, floorMat, ceilingMat, matteMat, textureLoader;

function enterGallerySpace() {
  document.getElementById("enter-cta").style.opacity = "0";
  document.getElementById("entrance-gate").classList.add("open");

  setTimeout(() => {
    document.getElementById("entrance-gate").style.display = "none";
    const loader = document.getElementById("gallery-loader");
    loader.style.display = "flex";
    loader.style.opacity = "1";

    init3DGallery();
  }, 2000);
}

function init3DGallery() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0a09);
  scene.fog = new THREE.FogExp2(0x0a0a09, isMobile ? 0.025 : 0.015);

  const fov = isMobile ? 65 : 52;
  camera = new THREE.PerspectiveCamera(
    fov,
    window.innerWidth / window.innerHeight,
    0.1,
    1000,
  );

  if (isMobile) {
    camera.position.set(0, 0.8, 15);
  } else {
    camera.position.set(0, 1.2, 20);
  }

  renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: "high-performance",
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = !isMobile;

  // Quality Fix: Ensure proper color encoding for realistic textures
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;

  document.getElementById("canvas-container").appendChild(renderer.domElement);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.55);
  scene.add(ambientLight);

  const loadingManager = new THREE.LoadingManager();
  const progressPercent = document.getElementById("loader-percentage");
  const progressBar = document.getElementById("loader-bar");
  const loaderScreen = document.getElementById("gallery-loader");

  loadingManager.onProgress = function (url, itemsLoaded, itemsTotal) {
    const progress = Math.floor((itemsLoaded / itemsTotal) * 100);
    progressPercent.innerText = progress + "%";
    progressBar.style.width = progress + "%";
  };

  loadingManager.onLoad = function () {
    setTimeout(() => {
      loaderScreen.style.opacity = "0";
      document.getElementById("canvas-container").style.display = "block";
      document.getElementById("gallery-nav").style.display = "flex";

      setTimeout(() => {
        loaderScreen.style.display = "none";
      }, 1000);
    }, 400);
  };

  textureLoader = new THREE.TextureLoader(loadingManager);

  const wallTexture = textureLoader.load("texture/test.webp");
  wallTexture.wrapS = THREE.RepeatWrapping;
  wallTexture.wrapT = THREE.RepeatWrapping;
  wallTexture.repeat.set(isMobile ? 2 : 3, 2);
  wallTexture.encoding = THREE.sRGBEncoding; // Quality fix

  const floorTexture = textureLoader.load("texture/floor.jpeg");
  floorTexture.wrapS = THREE.RepeatWrapping;
  floorTexture.wrapT = THREE.RepeatWrapping;
  floorTexture.repeat.set(isMobile ? 2 : 4, 4);
  floorTexture.encoding = THREE.sRGBEncoding; // Quality fix

  const ceilingTexture = textureLoader.load("texture/cel.jpeg");
  ceilingTexture.wrapS = THREE.RepeatWrapping;
  ceilingTexture.wrapT = THREE.RepeatWrapping;
  ceilingTexture.repeat.set(4, 4);
  ceilingTexture.encoding = THREE.sRGBEncoding; // Quality fix

  wallMat = new THREE.MeshStandardMaterial({
    map: wallTexture,
    roughness: 0.7,
  });
  floorMat = new THREE.MeshStandardMaterial({
    map: floorTexture,
    roughness: 0.4,
  });
  ceilingMat = new THREE.MeshStandardMaterial({
    map: ceilingTexture,
    roughness: 0.8,
  });
  matteMat = new THREE.MeshStandardMaterial({
    color: 0x0c0c0b,
    roughness: 0.95,
  });

  buildStartingHallway();
  buildRoomModule(0);
  buildRoomModule(1);

  const raycaster = new THREE.Raycaster();
  const mouseCoords = new THREE.Vector2();

  function onGalleryInteract(event) {
    const clientX =
      event.clientX || (event.touches && event.touches[0].clientX);
    const clientY =
      event.clientY || (event.touches && event.touches[0].clientY);

    if (!clientX || !clientY) return;

    mouseCoords.x = (clientX / window.innerWidth) * 2 - 1;
    mouseCoords.y = -(clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouseCoords, camera);
    const intersectors = raycaster.intersectObjects(clickableObjects);

    if (intersectors.length > 0) {
      const hitArt = intersectors[0].object.userData;
      if (hitArt && hitArt.src) {
        focusArt(hitArt.src, hitArt.title);
      }
    }
  }

  window.addEventListener("click", onGalleryInteract);
  window.addEventListener("touchstart", onGalleryInteract);
  window.addEventListener("resize", onWindowResize);

  animateGalleryFrameLoop();
}

function buildStartingHallway() {
  const entryZ = 24;
  const entryX = 0;

  const doorTexture = textureLoader.load("texture/door.png");
  doorTexture.encoding = THREE.sRGBEncoding;

  const entryWallMat = new THREE.MeshStandardMaterial({
    map: wallMat.map,
    roughness: 0.7,
    side: THREE.DoubleSide,
  });

  const entryWall = new THREE.Mesh(
    new THREE.PlaneGeometry(35, 20),
    entryWallMat,
  );
  entryWall.position.set(entryX, 2, entryZ);
  scene.add(entryWall);

  const doorGeo = new THREE.PlaneGeometry(
    isMobile ? 4.5 : 6,
    isMobile ? 8.5 : 11,
  );
  const doorMat = new THREE.MeshStandardMaterial({
    map: doorTexture,
    transparent: true,
    roughness: 0.6,
    side: THREE.DoubleSide,
  });

  const doorMesh = new THREE.Mesh(doorGeo, doorMat);
  doorMesh.position.set(entryX, isMobile ? -2.5 : -1.5, entryZ - 0.05);
  scene.add(doorMesh);

  const frameThickness = 0.3;
  const frameMaterial = new THREE.MeshStandardMaterial({
    color: 0x0d0805,
    roughness: 0.7,
  });
  const w = isMobile ? 4.5 : 6;
  const h = isMobile ? 8.5 : 11;
  const yOff = isMobile ? -2.5 : -1.5;

  const topTrim = new THREE.Mesh(
    new THREE.BoxGeometry(w + frameThickness * 2, frameThickness, 0.2),
    frameMaterial,
  );
  topTrim.position.set(entryX, yOff + h / 2 + frameThickness / 2, entryZ - 0.1);
  scene.add(topTrim);

  const leftTrim = new THREE.Mesh(
    new THREE.BoxGeometry(frameThickness, h, 0.2),
    frameMaterial,
  );
  leftTrim.position.set(
    entryX - w / 2 - frameThickness / 2,
    yOff,
    entryZ - 0.1,
  );
  scene.add(leftTrim);

  const rightTrim = new THREE.Mesh(
    new THREE.BoxGeometry(frameThickness, h, 0.2),
    frameMaterial,
  );
  rightTrim.position.set(
    entryX + w / 2 + frameThickness / 2,
    yOff,
    entryZ - 0.1,
  );
  scene.add(rightTrim);

  const entranceLeftWall = new THREE.Mesh(
    new THREE.PlaneGeometry(60, 20),
    new THREE.MeshStandardMaterial({
      map: wallMat.map,
      roughness: 0.7,
      side: THREE.DoubleSide,
    }),
  );

  entranceLeftWall.rotation.y = Math.PI / 2;
  entranceLeftWall.position.set(-17.5, 2, 6);
  scene.add(entranceLeftWall);
}

function buildRoomModule(roomIndex) {
  const groupOffset = roomIndex * roomSpacingX;

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(roomSpacingX, 35),
    floorMat,
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(groupOffset, -7.5, 0);
  scene.add(floor);

  const ceiling = new THREE.Mesh(
    new THREE.PlaneGeometry(roomSpacingX, 35),
    ceilingMat,
  );
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.set(groupOffset, 11.5, 0);
  scene.add(ceiling);

  const mainWall = new THREE.Mesh(
    new THREE.PlaneGeometry(roomSpacingX, 20),
    wallMat,
  );
  mainWall.position.set(groupOffset, 2, -12);
  scene.add(mainWall);

  let artPositions = [];
  if (isMobile) {
    artPositions = [
      {
        x: groupOffset,
        maxW: 6.5,
        maxH: 7.5,
        artIdx: Math.abs(roomIndex) % artworksPool.length,
      },
    ];
  } else {
    artPositions = [
      {
        x: groupOffset - 7,
        maxW: 5.5,
        maxH: 6.5,
        artIdx: Math.abs(roomIndex * 2) % artworksPool.length,
      },
      {
        x: groupOffset + 7,
        maxW: 5.5,
        maxH: 6.5,
        artIdx: Math.abs(roomIndex * 2 + 1) % artworksPool.length,
      },
    ];
  }

  artPositions.forEach((pos) => {
    const artData = artworksPool[pos.artIdx];
    const artGroup = new THREE.Group();
    artGroup.position.set(pos.x, isMobile ? 0.8 : 1.5, -11.85);

    const artSpot = new THREE.SpotLight(0xffddaa, 0.8, 24, 0.6, 0.4, 0.5);
    artSpot.position.set(0, 13, 4);
    artGroup.add(artSpot);

    const spotTarget = new THREE.Object3D();
    spotTarget.position.set(0, 0, 0);
    artGroup.add(spotTarget);
    artSpot.target = spotTarget;

    textureLoader.load(artData.src, function (texture) {
      // QUALITY FIX: Apply anisotropy and sRGB encoding for sharp, rich textures
      texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
      texture.encoding = THREE.sRGBEncoding;

      const imgAspect = texture.image.width / texture.image.height;
      const frameAspect = pos.maxW / pos.maxH;

      let finalW, finalH;
      if (imgAspect > frameAspect) {
        finalW = pos.maxW;
        finalH = pos.maxW / imgAspect;
      } else {
        finalH = pos.maxH;
        finalW = finalH * imgAspect;
      }

      const matteGeo = new THREE.PlaneGeometry(finalW, finalH);
      const matteMesh = new THREE.Mesh(matteGeo, matteMat);
      matteMesh.position.z = 0.005;
      artGroup.add(matteMesh);

      const artGeo = new THREE.PlaneGeometry(finalW, finalH);
      const artMat = new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 0.15,
        metalness: 0.05,
        emissive: new THREE.Color(0xffffff),
        emissiveMap: texture,
        emissiveIntensity: 0.15,
      });
      const artMesh = new THREE.Mesh(artGeo, artMat);
      artMesh.position.z = 0.01;

      artMesh.userData = { src: artData.src, title: artData.title };
      clickableObjects.push(artMesh);
      artGroup.add(artMesh);

      // ... (Inside the textureLoader.load callback) ...

      // --- Outer Frame Logic ---
      const frameMaterial = new THREE.MeshStandardMaterial({
        color: 0x2a2520,
        roughness: 0.9,
        metalness: 0.05,
        side: THREE.DoubleSide,
      });

      const frameThickness = isMobile ? 0.4 : 0.3;
      const frameDepth = 0.25;
      const innerRimWidth = 0.08;

      const createFramePart = (w, h, x, y) => {
        const mesh = new THREE.Mesh(
          new THREE.BoxGeometry(w, h, frameDepth),
          frameMaterial,
        );
        mesh.position.set(x, y, frameDepth / 2);
        artGroup.add(mesh);
      };

      createFramePart(
        finalW + frameThickness * 2,
        frameThickness,
        0,
        finalH / 2 + frameThickness / 2,
      );
      createFramePart(
        finalW + frameThickness * 2,
        frameThickness,
        0,
        -(finalH / 2 + frameThickness / 2),
      );
      createFramePart(
        frameThickness,
        finalH,
        -(finalW / 2 + frameThickness / 2),
        0,
      );
      createFramePart(
        frameThickness,
        finalH,
        finalW / 2 + frameThickness / 2,
        0,
      );

      // --- Inner Trim Logic ---
      const innerRimMat = new THREE.MeshStandardMaterial({
        color: 0x8b7355,
        roughness: 0.3,
        metalness: 0.7,
      });

      const createInnerRim = (w, h, x, y) => {
        const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), innerRimMat);
        mesh.position.set(x, y, 0.16);
        artGroup.add(mesh);
      };

      createInnerRim(
        finalW + innerRimWidth * 2,
        innerRimWidth,
        0,
        finalH / 2 + innerRimWidth / 2,
      );
      createInnerRim(
        finalW + innerRimWidth * 2,
        innerRimWidth,
        0,
        -(finalH / 2 + innerRimWidth / 2),
      );
      createInnerRim(
        innerRimWidth,
        finalH,
        -(finalW / 2 + innerRimWidth / 2),
        0,
      );
      createInnerRim(innerRimWidth, finalH, finalW / 2 + innerRimWidth / 2, 0);

      // --- Final Placard ---
      const textPlacard = create3DTagPlacard(artData.title);
      textPlacard.position.set(
        0,
        -(finalH / 2 + frameThickness + (isMobile ? 0.9 : 0.6)),
        0.02,
      );
      textPlacard.userData = { src: artData.src, title: artData.title };
      clickableObjects.push(textPlacard);
      artGroup.add(textPlacard);
    }); // End of textureLoader.load

    scene.add(artGroup);
  }); // End of artPositions.forEach
} // End of buildRoomModule

function create3DTagPlacard(textString) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = 1024;
  canvas.height = 256;

  const goldGradient = ctx.createLinearGradient(
    0,
    0,
    canvas.width,
    canvas.height,
  );
  goldGradient.addColorStop(0.0, "#5a6268");
  goldGradient.addColorStop(0.2, "#cbd5e1");
  goldGradient.addColorStop(0.5, "#334155");
  goldGradient.addColorStop(0.8, "#e2e8f0");
  goldGradient.addColorStop(1.0, "#475569");

  ctx.fillStyle = goldGradient;
  if (ctx.roundRect) {
    ctx.roundRect(10, 10, 1004, 236, 4);
  } else {
    ctx.fillRect(10, 10, 1004, 236);
  }
  ctx.fill();
  ctx.strokeStyle = "#aa7c11";
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.beginPath();
  ctx.strokeStyle = "#5c4308";
  ctx.lineWidth = 4;
  if (ctx.roundRect) {
    ctx.roundRect(24, 24, 976, 208, 2);
  } else {
    ctx.rect(24, 24, 976, 208);
  }
  ctx.stroke();
  ctx.fillStyle = "#0a0907";
  ctx.font =
    'bold 56px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = "rgba(255, 255, 255, 0.45)";
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 2;
  ctx.shadowBlur = 1;
  ctx.fillText(textString.toUpperCase(), canvas.width / 2, canvas.height / 2);
  ctx.shadowColor = "transparent";

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = renderer ? renderer.capabilities.getMaxAnisotropy() : 8;

  const material = new THREE.MeshStandardMaterial({
    map: texture,
    roughness: 0.2,
    metalness: 0.8,
    emissive: new THREE.Color("#ffdf6d"),
    emissiveMap: texture,
    emissiveIntensity: 0.45,
  });

  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(isMobile ? 3.2 : 2.6, isMobile ? 0.8 : 0.65),
    material,
  );
  return mesh;
}

let isMoving = false;
function navigateCorridor(direction) {
  if (isMoving) return;
  isMoving = true;
  currentRoomIndex += direction;
  if (currentRoomIndex < 0) currentRoomIndex = 0;
  targetCameraX = currentRoomIndex * roomSpacingX;
  buildRoomModule(currentRoomIndex + direction);
}

function animateGalleryFrameLoop() {
  requestAnimationFrame(animateGalleryFrameLoop);
  if (!isMobile && camera.position.z > 13) {
    camera.position.z -= 0.12;
  }
  camera.position.x += (targetCameraX - camera.position.x) * 0.1;

  if (Math.abs(camera.position.x - targetCameraX) < 0.05) {
    camera.position.x = targetCameraX;
    isMoving = false;
  }
  renderer.render(scene, camera);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}

function focusArt(sourcePath, titleText) {
  const lightbox = document.getElementById("art-lightbox");
  document.getElementById("lightbox-img").src = sourcePath;
  document.getElementById("lightbox-title").innerText = titleText;
  lightbox.classList.remove("hidden");
  lightbox.classList.add("flex");
}

function closeLightbox() {
  const lightbox = document.getElementById("art-lightbox");
  lightbox.classList.add("hidden");
  lightbox.classList.remove("flex");
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeLightbox();
  if (e.key === "ArrowRight" || e.key.toLowerCase() === "d")
    navigateCorridor(1);
  if (e.key === "ArrowLeft" || e.key.toLowerCase() === "a")
    navigateCorridor(-1);
});
