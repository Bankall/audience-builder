CREATE DATABASE IF NOT EXIST audience_builder;
USE audience_builder;
CREATE TABLE `audience_analysis` (
  `id` varchar(8) NOT NULL,
  `creation_date` datetime NOT NULL DEFAULT current_timestamp(),
  `url` varchar(255) NOT NULL,
  `automatic_keywords` varchar(2000) NOT NULL,
  `manual_keywords` varchar(2000) NOT NULL,
  `analysis_results` mediumtext NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    
