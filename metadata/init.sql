DROP TABLE IF EXISTS `problems`;
-- 设备编号、岗位号联合索引
-- 除序号、状态外，所有字段联合唯一索引
CREATE TABLE `problems` (
  `id`           BIGINT(20)   NOT NULL AUTO_INCREMENT COMMENT '序号',
  `plant`        VARCHAR(20)  NOT NULL COMMENT '厂房',
  `device_num`   VARCHAR(50)  NOT NULL COMMENT '设备编号' COLLATE utf8mb4_bin,
  `station_num`  VARCHAR(50)  NOT NULL COMMENT '岗位号' COLLATE utf8mb4_bin,
  `name`         VARCHAR(50)  NOT NULL COMMENT '提交人',
  `date_created` DATETIME     NOT NULL COMMENT '提交日期',
  `detail`       VARCHAR(255) NOT NULL COMMENT '问题点描述',
  `is_need_help` VARCHAR(50)  NOT NULL COMMENT '是否需要其他部门协助',
  `remark`       VARCHAR(255) NULL COMMENT '备注，未完成时填写',
  `picture`      VARCHAR(255) NOT NULL COMMENT '图片url',
  `return_reason`VARCHAR(255) NULL COMMENT '退回理由',
  `status`       VARCHAR(20)  DEFAULT 'unfinished' COMMENT '状态',
  PRIMARY KEY (`id`),
  INDEX idx_device_station (`device_num`, `station_num`),
  UNIQUE INDEX unique_idx (`plant`, `device_num`, `station_num`, `name`, `date_created`, `detail`, `picture`)
);
-- 测试数据
INSERT INTO `problems`(`id`, `plant`, `device_num`, `station_num`, `name`, `date_created`, `detail`, `is_need_help`, `picture`, `status`) VALUES (1, '组装', 'MJK50027', 'A001', '钱敏杰', '2023-03-21 18:05:23', '水管破裂', '否', 'http://pubuserqiniu.paperol.cn/182616674_552_q8_1669001562ASfNyh.jpg?attname=552_8_IMG_20221121_113127.jpg&e=1684564511&token=-kY3jr8KMC7l3KkIN3OcIs8Q4s40OfGgUHr1Rg4D:KUxli-JCC4admPd1ZuWvaqfYYG0=', 'finished');
INSERT INTO `problems`(`id`, `plant`, `device_num`, `station_num`, `name`, `date_created`, `detail`, `is_need_help`, `picture`, `status`) VALUES (2, '组装', 'MJK50027', 'A001', '侯典巍', '2023-03-22 09:46:32', '电磁阀排气处漏气', 'ZT1-保全', 'http://pubuserqiniu.paperol.cn/182616674_553_q8_1669010581dd8MMc.jpg?attname=553_8_mmexport1669010490064.jpg&e=1684564511&token=-kY3jr8KMC7l3KkIN3OcIs8Q4s40OfGgUHr1Rg4D:nPWvW7Jk-4XJ9VzCdmvhZrpjqYA=', 'finished');
INSERT INTO `problems`(`id`, `plant`, `device_num`, `station_num`, `name`, `date_created`, `detail`, `is_need_help`, `picture`, `status`) VALUES (3, '组装', 'MJK50027', 'A001', '朱鑫宇', '2023-03-22 09:47:15', '传感器上加一个黄色盖子', 'ZT1-保全', 'http://pubuserqiniu.paperol.cn/182616674_554_q8_1669017089mrs7ek.jpeg?attname=554_8_111F6F89-00D0-4FD5-8CA1-7DA2FC543DD5.jpeg&e=1684564511&token=-kY3jr8KMC7l3KkIN3OcIs8Q4s40OfGgUHr1Rg4D:iy-fwztq29KDsDUb91Yp-nTZPfw=', 'finished');
INSERT INTO `problems`(`id`, `plant`, `device_num`, `station_num`, `name`, `date_created`, `detail`, `is_need_help`, `picture`, `status`) VALUES (4, '组装', 'MJK50027', 'A001', '朱鑫宇', '2023-03-22 09:49:22', '缺少螺栓', 'ZT1-保全', 'http://pubuserqiniu.paperol.cn/182616674_555_q8_16690960042cKnGc.jpg?attname=555_8_3f252464b1e3c4f70e646f0b5697fbcb.jpg&e=1684564511&token=-kY3jr8KMC7l3KkIN3OcIs8Q4s40OfGgUHr1Rg4D:xS0NUjri9X1P3jjTQNPi7T805kI=', 'unfinished');
INSERT INTO `problems`(`id`, `plant`, `device_num`, `station_num`, `name`, `date_created`, `detail`, `is_need_help`, `picture`, `status`) VALUES (5, '组装', 'MJK50027', 'A001', '倪超炜', '2023-03-22 09:49:58', '滚轮油污清扫困难。', 'ZT3-加工技术', 'http://pubuserqiniu.paperol.cn/182616674_562_q8_16692776784SHkyP.jpeg?attname=562_8_FE2D9C80-416F-4B63-A6E2-2CEEE75D8586.jpeg&e=1684564512&token=-kY3jr8KMC7l3KkIN3OcIs8Q4s40OfGgUHr1Rg4D:svyhnm-ndgo-gv5Zt-uYv1XhZU0=', 'unfinished');
INSERT INTO `problems`(`id`, `plant`, `device_num`, `station_num`, `name`, `date_created`, `detail`, `is_need_help`, `picture`, `status`) VALUES (6, '组装', 'mjk50027', 'A001', '饶玉潇', '2023-03-22 09:50:44', '前面盖板海绵垫损坏', '改善班', 'http://pubuserqiniu.paperol.cn/182616674_563_q8_1669277770XmHEtx.jpg?attname=563_8_IMG_20221124_161501.jpg&e=1684564512&token=-kY3jr8KMC7l3KkIN3OcIs8Q4s40OfGgUHr1Rg4D:J2ANQlgggYcUlIao0XimiXVgsU4=', 'unfinished');
INSERT INTO `problems`(`id`, `plant`, `device_num`, `station_num`, `name`, `date_created`, `detail`, `is_need_help`, `picture`, `status`) VALUES (7, '组装', 'MJK50027', '(跳过)', '饶玉潇', '2023-03-22 09:50:44', '前面盖板海绵垫损坏', '改善班', 'http://pubuserqiniu.paperol.cn/182616674_563_q8_1669277770XmHEtx.jpg?attname=563_8_IMG_20221124_161501.jpg&e=1684564512&token=-kY3jr8KMC7l3KkIN3OcIs8Q4s40OfGgUHr1Rg4D:J2ANQlgggYcUlIao0XimiXVgsU4=', 'finished');
-- 幂等性插入数据
INSERT IGNORE INTO `problems`(`plant`, `device_num`, `station_num`, `name`, `date_created`, `detail`, `is_need_help`, `picture`) VALUES ('组装', 'mjk50027', 'A001', '饶玉潇', '2023-03-22 09:50:44', '前面盖板海绵垫损坏', '改善班', 'http://pubuserqiniu.paperol.cn/182616674_563_q8_1669277770XmHEtx.jpg?attname=563_8_IMG_20221124_161501.jpg&e=1684564512&token=-kY3jr8KMC7l3KkIN3OcIs8Q4s40OfGgUHr1Rg4D:J2ANQlgggYcUlIao0XimiXVgsU4=');
