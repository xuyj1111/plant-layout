DROP TABLE IF EXISTS `problems`;
CREATE TABLE `problems` (
  `id`           BIGINT(20)   NOT NULL AUTO_INCREMENT COMMENT '序号',
  `plant`        VARCHAR(255) NOT NULL COMMENT '厂房',
  `device_num`   VARCHAR(255) NOT NULL COMMENT '设备编号',
  `station_num`  VARCHAR(255) DEFAULT NULL COMMENT '工位号',
  `date_created` DATETIME     NOT NULL COMMENT '提交日期',
  `detail`       VARCHAR(500) NOT NULL COMMENT '问题点描述',
  `is_need_help`   VARCHAR(255) NOT NULL COMMENT '是否需要其他部门协助',
  `picture`      VARCHAR(255) NOT NULL COMMENT '图片url',
  `status`       VARCHAR(255) NOT NULL COMMENT '状态',
  PRIMARY KEY (`id`)
)
INSERT INTO `test`.`problems` (`id`, `plant`, `device_num`, `station_num`, `date_created`, `detail`, `is_need_help`, `picture`, `status`) 
VALUES (1, 'assy', 'MJD50027', '53c9b17d', '2023-03-21 18:05:23', '有问题', '不需要', 'www.baidu.com', 'active');