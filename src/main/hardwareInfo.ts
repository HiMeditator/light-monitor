import si from 'systeminformation';
import { ipcMain } from 'electron';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';

const execAsync = promisify(exec);
const readFileAsync = promisify(fs.readFile);

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
        try {
            // 先尝试用 systeminformation 获取
            const siData = await si.cpuTemperature();
            if (siData.main !== null) {
                // 如果库已经提供最大温度则直接使用，否则尝试计算
                return {
                    main: siData.main,
                    max: siData.max || Math.max(...(siData.cores || [])),
                    cores: siData.cores
                };
            }

            // 分平台回退方案
            switch (process.platform) {
                case 'win32':
                    return await getWindowsCpuTemp();
                case 'linux':
                    return await getLinuxCpuTemp();
                default:
                    return { main: null, max: null };
            }
        } catch (error) {
            return { main: null, max: null };
        }
    });
}

// Windows 使用 WMI 查询
async function getWindowsCpuTemp() {
    try {
        const { stdout } = await execAsync(
            'powershell "Get-WmiObject MSAcpi_ThermalZoneTemperature -Namespace root/wmi | Select-Object -ExpandProperty CurrentTemperature"'
        );
        
        // 处理可能存在的空数据
        const temps = stdout.trim().split('\r\n')
            .filter(Boolean)
            .map(t => parseInt(t, 10))
            .filter(t => !isNaN(t));

        if (temps.length === 0) return { main: null, max: null };

        // 计算平均温度和最高温度（转换为摄氏度）
        const avgKelvin = temps.reduce((a, b) => a + b, 0) / temps.length;
        const maxKelvin = Math.max(...temps);
        
        return {
            main: Number((avgKelvin / 10 - 273.15).toFixed(1)),
            max: Number((maxKelvin / 10 - 273.15).toFixed(1))
        };
    } catch(err) {
        return { main: null, max: null };
    }
}

// Linux 读取传感器文件
async function getLinuxCpuTemp() {
    try {
        const zones = await fs.promises.readdir('/sys/class/thermal');
        const cpuZones = zones.filter(z => z.startsWith('thermal_zone'));
        
        const temps: number[] = [];
        for (const zone of cpuZones) {
            try {
                const type = await readFileAsync(`/sys/class/thermal/${zone}/type`, 'utf8');
                // 扩展支持的传感器类型
                if (['x86_pkg_temp', 'cpu_thermal', 'coretemp'].includes(type.trim())) {
                    const tempStr = await readFileAsync(`/sys/class/thermal/${zone}/temp`, 'utf8');
                    const temp = parseInt(tempStr, 10);
                    if (!isNaN(temp)) temps.push(temp);
                }
            } catch (error) {
                console.error(`读取 ${zone} 温度失败:`, error);
            }
        }

        if (temps.length === 0) return { main: null, max: null };

        // 计算平均温度和最高温度（转换为摄氏度）
        const avgTemp = temps.reduce((a, b) => a + b, 0) / temps.length;
        return {
            main: Number((avgTemp / 1000).toFixed(1)),
            max: Number((Math.max(...temps) / 1000).toFixed(1))
        };
    } catch (error) {
        return { main: null, max: null };
    }
}