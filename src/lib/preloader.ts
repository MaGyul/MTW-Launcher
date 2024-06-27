function onDistroLoad(logger: Logger, data?: HeliosDistribution) {
    if (data != null) {
        if (config.getSelectedServer() == null || data.getServerById(config.getSelectedServer()) == null) {
            logger.info('Determining default selected server..');
            config.setSelectedServer(data.getMainServer().rawServer.id);
            config.save();
        }
    }
}

export async function startInit(logger: Logger) {
    MTWNative.DistroAPI.setCommonDir(config.getCommonDirectory());
    MTWNative.DistroAPI.setInstanceDir(config.getInstanceDirectory());

    const heliosDistro = await MTWNative.DistroAPI.getDistribution();
    logger.info('Loaded distribution index.');

    onDistroLoad(logger, heliosDistro);
    
    await MTWNative.clearTempNativeFolder(logger);
}