package com.examly.springapp;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import java.io.File;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.context.ActiveProfiles;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.fail;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import org.springframework.test.web.servlet.result.MockMvcResultMatchers;

@ActiveProfiles("test")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
@SpringBootTest(classes = SpringappApplication.class)
@AutoConfigureMockMvc
class SpringappSongTests {

    @Autowired
    private MockMvc mockMvc;

    // ---------- Core API Tests ----------

    @Order(1)
    @Test
    void AddSongReturns200() throws Exception {
        String songData = """
                {
                    "songTitle": "Shape of You",
                    "artist": "Ed Sheeran",
                    "album": "Divide",
                    "genre": "Pop",
                    "duration": 240
                }
                """;

        mockMvc.perform(MockMvcRequestBuilders.post("/api/songs/addSong")
                        .with(jwt())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(songData)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(jsonPath("$.songTitle").value("Shape of You"))
                .andReturn();
    }

    @Order(2)
    @Test
    void GetAllSongsReturnsArray() throws Exception {
        mockMvc.perform(get("/api/songs/allSongs")
                        .with(jwt())
                        .accept(MediaType.APPLICATION_JSON))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andReturn();
    }

    @Order(3)
    @Test
    void GetSongsByGenreReturns200() throws Exception {
        mockMvc.perform(get("/api/songs/byGenre")
                        .with(jwt())
                        .param("genre", "Pop")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].songTitle").exists())
                .andReturn();
    }

    @Order(4)
    @Test
    void GetSongsSortedByArtistReturns200() throws Exception {
        mockMvc.perform(get("/api/songs/sortedByArtist")
                        .with(jwt())
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andReturn();
    }

    
    // ---------- Project Structure Tests ----------

    @Test
    void ControllerDirectoryExists() {
        String directoryPath = "src/main/java/com/examly/springapp/controller";
        File directory = new File(directoryPath);
        assertTrue(directory.exists() && directory.isDirectory());
    }

    @Test
    void SongControllerFileExists() {
        String filePath = "src/main/java/com/examly/springapp/controller/SongController.java";
        File file = new File(filePath);
        assertTrue(file.exists() && file.isFile());
    }

    @Test
    void ModelDirectoryExists() {
        String directoryPath = "src/main/java/com/examly/springapp/model";
        File directory = new File(directoryPath);
        assertTrue(directory.exists() && directory.isDirectory());
    }

    @Test
    void SongModelFileExists() {
        String filePath = "src/main/java/com/examly/springapp/model/Song.java";
        File file = new File(filePath);
        assertTrue(file.exists() && file.isFile());
    }

    @Test
    void RepositoryDirectoryExists() {
        String directoryPath = "src/main/java/com/examly/springapp/repository";
        File directory = new File(directoryPath);
        assertTrue(directory.exists() && directory.isDirectory());
    }

    @Test
    void ServiceDirectoryExists() {
        String directoryPath = "src/main/java/com/examly/springapp/service";
        File directory = new File(directoryPath);
        assertTrue(directory.exists() && directory.isDirectory());
    }

    @Test
    void SongServiceClassExists() {
        checkClassExists("com.examly.springapp.service.SongService");
    }

    @Test
    void SongModelClassExists() {
        checkClassExists("com.examly.springapp.model.Song");
    }

    @Test
    void SongModelHasSongTitleField() {
        checkFieldExists("com.examly.springapp.model.Song", "songTitle");
    }

    @Test
    void SongModelHasArtistField() {
        checkFieldExists("com.examly.springapp.model.Song", "artist");
    }

    @Test
    void SongModelHasAlbumField() {
        checkFieldExists("com.examly.springapp.model.Song", "album");
    }

    @Test
    void SongModelHasGenreField() {
        checkFieldExists("com.examly.springapp.model.Song", "genre");
    }

    @Test
    void SongModelHasDurationField() {
        checkFieldExists("com.examly.springapp.model.Song", "duration");
    }

    @Test
    void SongRepoExtendsJpaRepository() {
        checkClassImplementsInterface("com.examly.springapp.repository.SongRepository",
                "org.springframework.data.jpa.repository.JpaRepository");
    }

    // ---------- Helpers ----------

    private void checkClassExists(String className) {
        try {
            Class.forName(className);
        } catch (ClassNotFoundException e) {
            fail("Class " + className + " does not exist.");
        }
    }

    private void checkFieldExists(String className, String fieldName) {
        try {
            Class<?> clazz = Class.forName(className);
            clazz.getDeclaredField(fieldName);
        } catch (ClassNotFoundException | NoSuchFieldException e) {
            fail("Field " + fieldName + " in class " + className + " does not exist.");
        }
    }

    private void checkClassImplementsInterface(String className, String interfaceName) {
        try {
            Class<?> clazz = Class.forName(className);
            Class<?> interfaceClazz = Class.forName(interfaceName);
            assertTrue(interfaceClazz.isAssignableFrom(clazz));
        } catch (ClassNotFoundException e) {
            fail("Class " + className + " or interface " + interfaceName + " does not exist.");
        }
    }
}
