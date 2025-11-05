import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const scene = new THREE.Scene();
scene.background = new THREE.Color("black");

const canvas = document.querySelector("canvas.webgl");

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);
camera.position.set(0, 5, 15);
scene.add(camera);


const renderer = new THREE.WebGLRenderer({ canvas });
renderer.setSize(window.innerWidth - 250, window.innerHeight);

const labelStart = document.getElementById("label-start");
const labelEnd = document.getElementById("label-end");


const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;


const ambientLight = new THREE.AmbientLight(0xffffff, 3);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 4);
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);


const raycasting = new THREE.Raycaster()
let mouse = new THREE.Vector2()

window.addEventListener("mousemove", (e) => {
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
});
window.addEventListener("click", () => {
  if (currentIntersect) {
    // create main div
    const modalDive = document.createElement('div')
    modalDive.classList = "modal"
    // create conatiner div
    const modalContainer = document.createElement('div')
    modalContainer.classList = "modal-container"
    modalDive.appendChild(modalContainer)
    // create heading inside container div
    const heading = document.createElement('h2')
    modalContainer.appendChild(heading)
    heading.innerHTML = "Cylender details"
    // create starting paragraph inside container div
    const staringCoordinatePara = document.createElement('p')
    staringCoordinatePara.innerHTML = ` staring coordinate (${currentIntersect[0].object.data.staring.x1},${currentIntersect[0].object.data.staring.y1},${currentIntersect[0].object.data.staring.z1})`
    modalContainer.appendChild(staringCoordinatePara)
    // create ending paragraph inside container div
    const endingCoordinatePara = document.createElement('p')
    endingCoordinatePara.innerHTML = ` staring coordinate (${currentIntersect[0].object.data.ending.x2},${currentIntersect[0].object.data.ending.y2},${currentIntersect[0].object.data.ending.z2})`
    modalContainer.appendChild(endingCoordinatePara)
    // create Base Radius inside container div
    const Baseradius = document.createElement('p')
    Baseradius.innerHTML = `Base Radius ${currentIntersect[0].object.data.BaseRadius}`
    modalContainer.appendChild(Baseradius)
    // create Top Radius inside container div
    const Topradius = document.createElement('p')
    Topradius.innerHTML = `Top Radius${currentIntersect[0].object.data.TopRadius}`
    modalContainer.appendChild(Topradius)
    // create Height inside container div
    const height = document.createElement('p')
    height.innerHTML = `Height ${currentIntersect[0].object.data.height}`
    modalContainer.appendChild(height)
    // close button 
    const close = document.createElement('button')
    close.classList = "close-button"
    close.innerHTML = "Colse"
    modalContainer.appendChild(close)
    document.body.appendChild(modalDive);
    console.log(modalDive)
    close.addEventListener("click", () => modalDive.remove())
  }

})
let cylinder;

// for get valid radius

const getValidRadius = (inputValue) => {
  let value = Number(inputValue)
  if (isNaN(value)) return value = 0.2
  if (value < 0) value = Math.abs(value);
  if (value < 0.001) value = 0.001;
  if (value > 100) value = 100;
  return value;
}
// create new geometry

const updateNewGeometry = () => {
  if (!cylinder) return;

  let BaseWidth = getValidRadius(document.getElementById("base-width").value);
  let TopWidth = getValidRadius(document.getElementById("top-width").value);

  const height = cylinder.data.height;

  const newGeo = new THREE.CylinderGeometry(BaseWidth, TopWidth, height, 32);

  cylinder.geometry.dispose();
  cylinder.geometry = newGeo;

  cylinder.data.BaseRadius = BaseWidth;
  cylinder.data.TopRadius = TopWidth;
};


document.getElementById("base-width").addEventListener("input", updateNewGeometry);
document.getElementById("top-width").addEventListener("input", updateNewGeometry);

document.getElementById("btn").addEventListener("click", () => {
  const x1 = Number(document.getElementById("x1").value);
  const y1 = Number(document.getElementById("y1").value);
  const z1 = Number(document.getElementById("z1").value);

  const x2 = Number(document.getElementById("x2").value);
  const y2 = Number(document.getElementById("y2").value);
  const z2 = Number(document.getElementById("z2").value);

  let BaseWidth = getValidRadius(document.getElementById("base-width").value)
  let TopWidth = getValidRadius(document.getElementById("top-width").value)

  const start = new THREE.Vector3(x1, y1, z1);
  const end = new THREE.Vector3(x2, y2, z2);
  const direction = new THREE.Vector3().subVectors(end, start).normalize();
  const distance = start.distanceTo(end);
  const midpoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);


  const geometry = new THREE.CylinderGeometry(BaseWidth, TopWidth, distance, 32);
  const material = new THREE.MeshStandardMaterial({ color: 0x00ffff });
  cylinder = new THREE.Mesh(geometry, material);

  cylinder.position.copy(midpoint);
  const yAxis = new THREE.Vector3(0, 1, 0);
  const rotationAxis = new THREE.Vector3().crossVectors(yAxis, direction).normalize();
  const angle = Math.acos(yAxis.dot(direction));
  cylinder.quaternion.setFromAxisAngle(rotationAxis, angle);
  cylinder.data = {
    staring: { x1, y1, z1 },
    ending: { x2, y2, z2 },
    BaseRadius: BaseWidth,
    TopRadius: TopWidth,
    height: distance

  }
  scene.add(cylinder);
});

window.addEventListener("resize", () => {
  camera.aspect = (window.innerWidth - 250) / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth - 250, window.innerHeight);
});

const gridHelper = new THREE.GridHelper(20, 20);
scene.add(gridHelper);


let currentIntersect = null;

const tick = () => {
  raycasting.setFromCamera(mouse, camera)
  if (cylinder) {

    const intersect = raycasting.intersectObject(cylinder);

    if (intersect.length > 0) {
      if (currentIntersect === null) {
        console.log("Intersecting with cylinder!");
        cylinder.material.color.set(0xff0000);
      }
      currentIntersect = intersect;
    }
    else {
      if (currentIntersect) {
        cylinder.material.color.set(0x00ffff);
        currentIntersect = null;
      }
    }
    const startPos = cylinder.data.staring;
    const endPos = cylinder.data.ending;

    const startVector = new THREE.Vector3(startPos.x1, startPos.y1, startPos.z1).project(camera);
    const endVector = new THREE.Vector3(endPos.x2, endPos.y2, endPos.z2).project(camera);

    const rect = renderer.domElement.getBoundingClientRect();

    const x1 = (startVector.x * 0.5 + 0.5) * rect.width + rect.left;
    const y1 = (-startVector.y * 0.5 + 0.5) * rect.height + rect.top;

    const x2 = (endVector.x * 0.5 + 0.5) * rect.width + rect.left;
    const y2 = (-endVector.y * 0.5 + 0.5) * rect.height + rect.top;


    labelStart.style.left = `${x1}px`;
    labelStart.style.top = `${y1}px`;
    labelStart.textContent = `Start (${startPos.x1}, ${startPos.y1}, ${startPos.z1})`;

    labelEnd.style.left = `${x2}px`;
    labelEnd.style.top = `${y2}px`;
    labelEnd.textContent = `End (${endPos.x2}, ${endPos.y2}, ${endPos.z2})`;
  }
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
};

tick();
