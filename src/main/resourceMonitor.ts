import si from 'systeminformation';
import { ipcMain } from 'electron';

export function handleResourceMonitor() {
    // 获取CPU使用率
    ipcMain.handle('get.cpuUsage', async () => {
        const data = await si.currentLoad();
        return data;
    });

    // 获取内存使用情况
    ipcMain.handle('get.memUsage', async () => {
        const data = await si.mem();
        return data;
    });

    // 获取磁盘使用情况
    ipcMain.handle('get.diskUsage', async () => {
        const data = await si.fsSize();
        return data;
    });

    // 获取网络使用情况
    ipcMain.handle('get.networkUsage', async () => {
        const data = await si.networkStats();
        return data;
    });

    // 获取系统资源使用情况（整合所有数据）
    ipcMain.handle('get.systemResources', async () => {
        try {
            const [cpuData, memData, diskData, networkData] = await Promise.all([
                si.currentLoad(),
                si.mem(),
                si.fsSize(),
                si.networkStats()
            ]);

            return {
                cpu: {
                    usage: cpuData.currentLoad,
                    cores: cpuData.cpus.map(core => core.load)
                },
                memory: {
                    total: memData.total,
                    used: memData.used,
                    free: memData.free,
                    usage: (memData.used / memData.total) * 100
                },
                disk: diskData.map(disk => ({
                    fs: disk.fs,
                    type: disk.type,
                    size: disk.size,
                    used: disk.used,
                    available: disk.available,
                    usage: (disk.used / disk.size) * 100
                })),
                network: networkData.map(net => ({
                    iface: net.iface,
                    rx_sec: net.rx_sec,
                    tx_sec: net.tx_sec,
                    rx_bytes: net.rx_bytes,
                    tx_bytes: net.tx_bytes
                }))
            };
        } catch (error) {
            console.error('获取系统资源数据失败:', error);
            throw error;
        }
    });
} 