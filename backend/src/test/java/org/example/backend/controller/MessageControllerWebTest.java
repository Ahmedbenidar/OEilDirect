package org.example.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.example.backend.model.Message;
import org.example.backend.model.Role;
import org.example.backend.model.Utilisateur;
import org.example.backend.service.MessageService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.mockito.Mockito.when;
import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class MessageControllerWebTest {

    @Mock
    MessageService messageService;

    @InjectMocks
    MessageController messageController;

    private final ObjectMapper om = new ObjectMapper();

    @Test
    void envoyerMessage_ok_retourneMap() throws Exception {
        Utilisateur sender = Utilisateur.builder().id(1L).prenom("A").nom("B").role(Role.PATIENT).build();
        Utilisateur receiver = Utilisateur.builder().id(2L).nom("Doc").role(Role.MEDECIN).build();
        Message msg = Message.builder()
                .id(10L)
                .sender(sender)
                .receiver(receiver)
                .contenu("hello")
                .lu(false)
                .dateEnvoi(LocalDateTime.now())
                .build();
        when(messageService.envoyerMessage(1L, 2L, "hello")).thenReturn(msg);

        ResponseEntity<Map<String, Object>> res = messageController.envoyerMessage(Map.of(
                "senderId", 1,
                "receiverId", 2,
                "contenu", "hello"
        ));
        assertEquals(HttpStatus.OK, res.getStatusCode());
        assertEquals(10L, ((Number) res.getBody().get("id")).longValue());
        assertEquals(1L, ((Number) res.getBody().get("senderId")).longValue());
        assertEquals(2L, ((Number) res.getBody().get("receiverId")).longValue());
        assertEquals("hello", res.getBody().get("contenu"));
        assertEquals("PATIENT", res.getBody().get("senderRole"));
    }

    @Test
    void conversation_ok() throws Exception {
        when(messageService.getConversation(1L, 2L)).thenReturn(List.of());
        ResponseEntity<List<Map<String, Object>>> res = messageController.getConversation(1L, 2L);
        assertEquals(HttpStatus.OK, res.getStatusCode());
    }
}

