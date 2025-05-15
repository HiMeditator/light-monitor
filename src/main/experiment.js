import si from 'systeminformation';

// si.memLayout().then(data => {
//     console.log(data);
// });

// si.processes().then(data => {
//     console.log(data);
// });

// si.processLoad().then(data => {
//     console.log(data);
// });

// si.services().then(data => {
//     console.log(data);
// });

// si.audio().then(data => {
//     console.log(data);
// });

// si.bluetoothDevices().then(data => {
//     console.log(data);
// });

si.osInfo().then(data => {
    console.log(data);
});