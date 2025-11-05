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

const raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();

window.addEventListener("mousemove", (e) => {
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
});

let cylinders = []; 
let currentIntersect = null;


window.addEventListener("click", () => {
  if (currentIntersect) {
    const obj = currentIntersect[0].object;

    const modalDive = document.createElement('div');
    modalDive.classList = "modal";

    const modalContainer = document.createElement('div');
    modalContainer.classList = "modal-container";
    modalDive.appendChild(modalContainer);

    modalContainer.innerHTML = `
      <h2>Cylinder Details</h2>
      <p>Start: (${obj.data.staring.x1}, ${obj.data.staring.y1}, ${obj.data.staring.z1})</p>
      <p>End: (${obj.data.ending.x2}, ${obj.data.ending.y2}, ${obj.data.ending.z2})</p>
      <p>Base Radius: ${obj.data.BaseRadius}</p>
      <p>Top Radius: ${obj.data.TopRadius}</p>
      <p>Height: ${obj.data.height}</p>
      <button class="close-button">Close</button>
    `;

    document.body.appendChild(modalDive);
    modalContainer.querySelector(".close-button").addEventListener("click", () => modalDive.remove());
  }
});

const getValidRadius = (inputValue) => {
  let value = Number(inputValue);
  if (isNaN(value)) value = 0.2;
  if (value < 0) value = Math.abs(value);
  if (value < 0.001) value = 0.001;
  if (value > 100) value = 100;
  return value;
};

let cylinder; 

const updateNewGeometry = () => {
  if (!cylinder) return;

  const BaseWidth = getValidRadius(document.getElementById("base-width").value);
  const TopWidth = getValidRadius(document.getElementById("top-width").value);
  const height = cylinder.data.height;

  const newGeo = new THREE.CylinderGeometry(BaseWidth, TopWidth, height, 32);
  cylinder.geometry.dispose();
  cylinder.geometry = newGeo;

  cylinder.data.BaseRadius = BaseWidth;
  cylinder.data.TopRadius = TopWidth;
};

document.getElementById("base-width").addEventListener("input", updateNewGeometry);
document.getElementById("top-width").addEventListener("input", updateNewGeometry);

const data = { nodes: [] };

document.getElementById("btn").addEventListener("click", () => {
  const x1 = Number(document.getElementById("x1").value);
  const y1 = Number(document.getElementById("y1").value);
  const z1 = Number(document.getElementById("z1").value);

  const x2 = Number(document.getElementById("x2").value);
  const y2 = Number(document.getElementById("y2").value);
  const z2 = Number(document.getElementById("z2").value);

  data.nodes.push({ x: x1, y: y1, z: z1 }, { x: x2, y: y2, z: z2 });

  data.nodes = data.nodes.filter((node, index, arr) =>
    index === arr.findIndex(n => n.x === node.x && n.y === node.y && n.z === node.z)
  );

  const BaseWidth = getValidRadius(document.getElementById("base-width").value);
  const TopWidth = getValidRadius(document.getElementById("top-width").value);

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
  };

  scene.add(cylinder);
  cylinders.push(cylinder);  

  const nodeData = document.querySelector(".node-data");
  nodeData.innerHTML = `
    <h3>All Coordinates</h3>
    <table>
      <thead>
        <tr>
          <th>#node</th>
          <th>X</th>
          <th>Y</th>
          <th>Z</th>
        </tr>
      </thead>
      <tbody></tbody>
    </table>
  `;

  const body = nodeData.querySelector("tbody");

  data.nodes.forEach((n, i) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${i + 1}</td>
      <td>${n.x}</td>
      <td>${n.y}</td>
      <td>${n.z}</td>
    `;
    body.appendChild(row);
  });
});

window.addEventListener("resize", () => {
  camera.aspect = (window.innerWidth - 250) / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth - 250, window.innerHeight);
});

scene.add(new THREE.GridHelper(20, 20));

const tick = () => {
  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObjects(cylinders);

  if (intersects.length > 0) {
    if (!currentIntersect || currentIntersect[0].object !== intersects[0].object) {
      if (currentIntersect) currentIntersect[0].object.material.color.set(0x00ffff);
      intersects[0].object.material.color.set(0xff0000);
      currentIntersect = intersects;
    }

    const obj = intersects[0].object;

    const startPos = obj.data.staring;
    const endPos = obj.data.ending;

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
    labelStart.style.display = "block";

    labelEnd.style.left = `${x2}px`;
    labelEnd.style.top = `${y2}px`;
    labelEnd.textContent = `End (${endPos.x2}, ${endPos.y2}, ${endPos.z2})`;
    labelEnd.style.display = "block";

  } else {
    if (currentIntersect) currentIntersect[0].object.material.color.set(0x00ffff);
    currentIntersect = null;

    labelStart.style.display = "none";
    labelEnd.style.display = "none";
  }

  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
};

tick();
