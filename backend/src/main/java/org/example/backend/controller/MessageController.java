package org.example.backend.controller;

import lombok.RequiredArgsConstructor;
import org.example.backend.model.Message;
import org.example.backend.model.Utilisateur;
import org.example.backend.service.MessageService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
public class MessageController {

    private final MessageService messageService;

    @PostMapping
    public ResponseEntity<Map<String, Object>> envoyerMessage(@RequestBody Map<String, Object> body) {
        Long senderId = Long.valueOf(body.get("senderId").toString());
        Long receiverId = Long.valueOf(body.get("receiverId").toString());
        String contenu = body.get("contenu").toString();
        Message msg = messageService.envoyerMessage(senderId, receiverId, contenu);
        return ResponseEntity.ok(toMap(msg));
    }

    @GetMapping("/conversation")
    public ResponseEntity<List<Map<String, Object>>> getConversation(
            @RequestParam Long user1, @RequestParam Long user2) {
        // NE PAS marquer comme lu automatiquement - fait par /read explicitement
        List<Message> messages = messageService.getConversation(user1, user2);
        return ResponseEntity.ok(messages.stream().map(this::toMap).toList());
    }

    @GetMapping("/contacts/{userId}")
    public ResponseEntity<List<Map<String, Object>>> getContacts(@PathVariable Long userId) {
        List<Utilisateur> contacts = messageService.getContacts(userId);
        Map<Long, Message> lastMessages = messageService.getLastMessagePerContact(userId);
        return ResponseEntity.ok(contacts.stream().map(u -> {
            Map<String, Object> m = contactToMap(u);
            Message last = lastMessages.get(u.getId());
            if (last != null) {
                m.put("lastMessageContenu", last.getContenu());
                m.put("lastMessageDate", last.getDateEnvoi());
                m.put("lastMessageSenderId", last.getSender().getId());
            }
            return m;
        }).toList());
    }

    @GetMapping("/unread-count/{userId}")
    public ResponseEntity<Map<String, Long>> getUnreadCount(@PathVariable Long userId) {
        long count = messageService.countUnread(userId);
        return ResponseEntity.ok(Map.of("count", count));
    }

    @GetMapping("/unread-per-contact/{userId}")
    public ResponseEntity<Map<String, Object>> getUnreadPerContact(@PathVariable Long userId) {
        Map<Long, Object[]> data = messageService.getUnreadPerContact(userId);
        Map<String, Object> result = new HashMap<>();
        data.forEach((contactId, info) -> {
            Map<String, Object> item = new HashMap<>();
            item.put("count", info[0]);
            if (info[1] != null) {
                Message last = (Message) info[1];
                item.put("senderNom", (last.getSender().getPrenom() != null ? last.getSender().getPrenom() + " " : "") + (last.getSender().getNom() != null ? last.getSender().getNom() : ""));
                item.put("lastContenu", last.getContenu());
                item.put("lastDate", last.getDateEnvoi());
            }
            result.put(String.valueOf(contactId), item);
        });
        return ResponseEntity.ok(result);
    }

    @PutMapping("/read")
    public ResponseEntity<Void> marquerLu(@RequestParam Long receiverId, @RequestParam Long senderId) {
        messageService.marquerLu(receiverId, senderId);
        return ResponseEntity.ok().build();
    }

    private Map<String, Object> toMap(Message m) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", m.getId());
        map.put("contenu", m.getContenu());
        map.put("dateEnvoi", m.getDateEnvoi());
        map.put("lu", m.isLu());
        if (m.getSender() != null) {
            map.put("senderId", m.getSender().getId());
            map.put("senderNom", (m.getSender().getPrenom() != null ? m.getSender().getPrenom() + " " : "") + (m.getSender().getNom() != null ? m.getSender().getNom() : ""));
            map.put("senderRole", m.getSender().getRole() != null ? m.getSender().getRole().name() : "");
        }
        if (m.getReceiver() != null) {
            map.put("receiverId", m.getReceiver().getId());
        }
        return map;
    }

    private Map<String, Object> contactToMap(Utilisateur u) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", u.getId());
        map.put("nom", u.getNom() != null ? u.getNom() : "");
        map.put("prenom", u.getPrenom() != null ? u.getPrenom() : "");
        map.put("role", u.getRole() != null ? u.getRole().name() : "");
        map.put("photoProfil", u.getPhotoProfil() != null ? u.getPhotoProfil() : "");
        return map;
    }
}
