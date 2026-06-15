-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: db_server
-- Generation Time: Jun 15, 2026 at 07:25 PM
-- Server version: 9.7.0
-- PHP Version: 8.2.27

SET
SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET
time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `intresting maps`
--

-- --------------------------------------------------------

--
-- Table structure for table `comments`
--

CREATE TABLE `comments`
(
    `id`         int  NOT NULL,
    `map_id`     int  NOT NULL,
    `user_id`    int  NOT NULL,
    `comment`    text NOT NULL,
    `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `comments`
--

INSERT INTO `comments` (`id`, `map_id`, `user_id`, `comment`, `created_at`)
VALUES (9, 1, 2,
        'Krass dass so viele Länder türkische Einwanderer als größte Gruppe haben – das Gastarbeiterprogramm hat echt Spuren hinterlassen',
        '2026-05-26 07:59:52'),
       (10, 1, 1, 'Interessant wie stark die koloniale Geschichte bei manchen Ländern noch sichtbar ist',
        '2026-05-26 07:59:52'),
       (11, 2, 1, 'Europa leuchtet nachts so hell wie ein einziger Stadtbereich – erschreckend', '2026-05-26 07:59:52'),
       (12, 2, 2, 'In Österreich ist es verglichen mit Deutschland noch recht gut, aber trotzdem zu viel',
        '2026-05-26 07:59:52'),
       (13, 3, 2, 'Deutschland auf der Autobahn ohne Limit und daneben Österreich mit 130 – lustige Grenze',
        '2026-05-26 07:59:52'),
       (14, 3, 1, 'Die USA mit so niedrigen Limits in Städten und dann auf Highways doch 80mph, macht keinen Sinn',
        '2026-05-26 07:59:52'),
       (15, 4, 1, 'Österreich Bier und Wein gleichzeitig – passt irgendwie perfekt', '2026-05-26 07:59:52'),
       (16, 4, 2, 'Der Schnaps-Gürtel im Osten ist real, war selbst in Tschechien und die trinken echt viel Slivovitz',
        '2026-05-26 07:59:52'),
       (17, 3, 2, 'jo', '2026-05-26 08:02:05'),
       (18, 4, 5, 'hallo', '2026-05-26 13:17:39');

-- --------------------------------------------------------

--
-- Table structure for table `maps`
--

CREATE TABLE `maps`
(
    `id`          int          NOT NULL,
    `title`       varchar(255) NOT NULL,
    `image_url`   varchar(500) DEFAULT NULL,
    `region`      varchar(100) DEFAULT NULL,
    `topic`       varchar(100) DEFAULT NULL,
    `description` text,
    `media_url`   varchar(500) DEFAULT NULL,
    `likes`       int          DEFAULT '0',
    `created_at`  timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `maps`
--

INSERT INTO `maps` (`id`, `title`, `image_url`, `region`, `topic`, `description`, `media_url`, `likes`, `created_at`)
VALUES (1, 'Europas 2. größte Nationalität', 'maps/map1/Europe2ndnationality.png', 'Europa', 'Migration',
        'Jedes Land trägt die Flagge seiner zweitgrößten Einwanderergruppe. Was diese Karte zeigt, ist eigentlich Geschichte - Gastarbeiterprogramme, Kriege, der Zerfall der Sowjetunion. Türkische Flaggen in Deutschland, Österreich, Dänemark. Polnische Flaggen fast überall im Westen. Und im Osten? Fast immer Russland. Grenzen auf der Karte sind fest - Menschen waren es nie.',
        'Brilliant Maps · Daten 2015', 234, '2026-05-10 09:00:00'),
       (2, 'Lichtverschmutzung weltweit', 'maps/map2/world-light-pollution.png', 'Welt', 'Klima',
        'Der Unterschied zwischen arm und reich - einfach von oben fotografiert. Westeuropa, die US-Ostküste, Japan leuchten rot-weiß. Nordkorea? Fast komplett dunkel. Das Niltal zieht sich wie ein Leuchtfaden durch die Sahara. Und Sibirien - riesig, leer, schwarz. Wer noch echte Dunkelheit erleben will: es werden gerade die letzten Flecken knapper.',
        'Light Pollution Atlas · David Lorenz', 87, '2026-05-18 14:30:00'),
       (3, 'Tempolimits weltweit', 'maps/map3/World_Speed_Limits.png', 'Welt', 'Verkehr',
        'Eine Karte über Regeln - und was sie über Kulturen verraten. Deutschland ist der einzige größere Staat ohne generelles Autobahntempo. Die meisten Länder liegen bei 120-130 km/h. Aber schau auf Afrika und Teile Asiens: 90 km/h oder weniger, oft auf schlechteren Straßen. Tempolimits sind nicht nur Physik - sie sind Politik, Infrastruktur und nationale Identität in einem Schild.',
        'Brilliant Maps · Wikipedia', 312, '2026-05-23 11:00:00'),
       (4, 'Bier, Wein oder Schnaps?', 'maps/map4/europe-most-popular-alcoholic-drink.png', 'Europa', 'Geografie',
        'Europa, aufgeteilt nach dem was abends im Glas landet. Der Westen und Süden - Frankreich, Italien, Spanien, Portugal - trinken Wein. Der Norden und die Mitte - Deutschland, Österreich, Polen - greifen zum Bier. Im Osten, von der Ukraine bis Belarus, dominieren Spirituosen. Diese Karte ist eigentlich eine Karte der Kulturen, Klimate und Geschichte. Und Islands Bierkultur? Die ist erst seit 1989 legal.',
        'WHO 2018 · Karte: Landgeist', 561, '2026-05-25 20:15:00');

-- --------------------------------------------------------

--
-- Table structure for table `map_tags`
--

CREATE TABLE `map_tags`
(
    `map_id` int NOT NULL,
    `tag_id` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `map_tags`
--

INSERT INTO `map_tags` (`map_id`, `tag_id`)
VALUES (1, 1),
       (2, 2),
       (3, 3),
       (4, 4);

-- --------------------------------------------------------

--
-- Table structure for table `tags`
--

CREATE TABLE `tags`
(
    `id`       int          NOT NULL,
    `name`     varchar(100) NOT NULL,
    `category` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `tags`
--

INSERT INTO `tags` (`id`, `name`, `category`)
VALUES (1, 'Migration', 'Thema'),
       (2, 'Klima', 'Thema'),
       (3, 'Verkehr', 'Thema'),
       (4, 'Geografie', 'Thema');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users`
(
    `id`            int          NOT NULL,
    `email`         varchar(255) NOT NULL,
    `password_hash` varchar(255) NOT NULL,
    `username`      varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `email`, `password_hash`, `username`)
VALUES (1, 'test@test.com', '$2y$10$lt6sDkAhpGkuaQCgtpcu/eqAKoNLrbn4Q6vXnsQchznsX7qT9Hn2G', 'testuser'),
       (2, 'chrisimail@gmail.com', '$2y$10$56MGpfn.QclBL12Orj03MeHww.PL0d52Gj7qNWKgQJukBIxFLgy.O', 'chrisi1'),
       (3, 'chrisizweitemail@gmail.com', '$2y$10$Hl/dtsOm6SmA.fgB9XbctO5tE0XugjpqByFTf5jEo0hgClrB46JV.', 'chrisi2'),
       (5, 'matzgo34@gmail.com', '$2y$10$l1ch6BTe7WVbKcePHLmM2OwEa1BW6fbtM4OGC71dmBJqnVdzubPaS', 'matzgo'),
       (6, 'chrismail@mail.com', '$2y$10$SE7mKg.aMRxfXRAhA7krs.HfXzn5ttEagLHR6Zwn0xJYlZJ.jl5Z.', 'Chris');

-- --------------------------------------------------------

--
-- Table structure for table `votes`
--

CREATE TABLE `votes`
(
    `id`      int NOT NULL,
    `user_id` int NOT NULL,
    `map_id`  int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `comments`
--
ALTER TABLE `comments`
    ADD PRIMARY KEY (`id`),
  ADD KEY `map_id` (`map_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `maps`
--
ALTER TABLE `maps`
    ADD PRIMARY KEY (`id`);

--
-- Indexes for table `map_tags`
--
ALTER TABLE `map_tags`
    ADD PRIMARY KEY (`map_id`, `tag_id`),
  ADD KEY `tag_id` (`tag_id`);

--
-- Indexes for table `tags`
--
ALTER TABLE `tags`
    ADD PRIMARY KEY (`id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
    ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `username` (`username`);

--
-- Indexes for table `votes`
--
ALTER TABLE `votes`
    ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_vote` (`user_id`,`map_id`),
  ADD KEY `map_id` (`map_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `comments`
--
ALTER TABLE `comments`
    MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT for table `maps`
--
ALTER TABLE `maps`
    MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `tags`
--
ALTER TABLE `tags`
    MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
    MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `votes`
--
ALTER TABLE `votes`
    MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `comments`
--
ALTER TABLE `comments`
    ADD CONSTRAINT `comments_ibfk_1` FOREIGN KEY (`map_id`) REFERENCES `maps` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `comments_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON
DELETE
CASCADE;

--
-- Constraints for table `map_tags`
--
ALTER TABLE `map_tags`
    ADD CONSTRAINT `map_tags_ibfk_1` FOREIGN KEY (`map_id`) REFERENCES `maps` (`id`),
  ADD CONSTRAINT `map_tags_ibfk_2` FOREIGN KEY (`tag_id`) REFERENCES `tags` (`id`);

--
-- Constraints for table `votes`
--
ALTER TABLE `votes`
    ADD CONSTRAINT `votes_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `votes_ibfk_2` FOREIGN KEY (`map_id`) REFERENCES `maps` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;