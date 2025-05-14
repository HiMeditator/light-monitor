import si from 'systeminformation';
import { ipcMain } from 'electron';

export function handelGetHardwareInfo() {
    ipcMain.handle('get.sysInfo', async () => {
        const data = await si.system();
        console.log(data);
        return data;
    })
    ipcMain.handle('get.osInfo', async () => {
        const data = await si.osInfo();
        return data;
    })
    ipcMain.handle('get.memInfo', async () => {
        const data = await si.mem();
        return data;
    })
    ipcMain.handle('get.disksInfo', async () => {
        const data = await si.diskLayout();
        return data;
    })
    ipcMain.handle('get.cpuInfo', async () => {
        const data = await si.cpu();
        return data;
    })
    ipcMain.handle('get.displayInfo', async () => {
        const data = await si.graphics();
        return data;
    })
}