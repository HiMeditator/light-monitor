import si from 'systeminformation';
import { ipcMain } from 'electron';

export function handelGetHardwareInfo() {
    ipcMain.handle('get.procInfo', async () => {
        const data = await si.processes();
        return data;
    })
    ipcMain.handle('get.sysInfo', async () => {
        const data = await si.system();
        return data;
    })
    ipcMain.handle('get.boardInfo', async () => {
        const data = await si.baseboard();
        return data;
    })
    ipcMain.handle('get.osInfo', async () => {
        const data = await si.osInfo();
        return data;
    })
    ipcMain.handle('get.memsInfo', async () => {
        const data = await si.memLayout();
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
    ipcMain.handle('get.batteryInfo', async () => {
        const data = await si.battery();
        return data;
    })
    ipcMain.handle('get.cpuTempInfo', async () => {
        const data = await si.cpuTemperature();
        return data;
    })
}