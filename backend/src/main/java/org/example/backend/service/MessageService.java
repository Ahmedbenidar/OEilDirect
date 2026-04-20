package org.example.backend.service;

import lombok.RequiredArgsConstructor;
import org.example.backend.exception.ResourceNotFoundException;
import org.example.backend.model.Message;
import org.example.backend.model.Role;
import org.example.backend.model.Utilisateur;
import org.example.backend.repository.DemandeRDVRepository;
import org.example.backend.repository.MessageRepository;
import org.example.backend.repository.UtilisateurRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MessageService {

    private final MessageRepository messageRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final DemandeRDVRepository demandeRDVRepository;

    @Transactional
    public Message envoyerMessage(Long senderId, Long receiverId, String contenu) {
        Utilisateur sender = utilisateurRepository.findById(senderId)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable: " + senderId));
        Utilisateur receiver = utilisateurRepository.findById(receiverId)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable: " + receiverId));
        Message message = Message.builder()
                .sender(sender).receiver(receiver).contenu(contenu).lu(false).build();
        return messageRepository.save(message);
    }

    public List<Message> getConversation(Long userId1, Long userId2) {
        Utilisateur u1 = utilisateurRepository.findById(userId1)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable: " + userId1));
        Utilisateur u2 = utilisateurRepository.findById(userId2)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable: " + userId2));
        return messageRepository.findConversation(u1, u2);
    }

    @Transactional
    public void marquerLu(Long receiverId, Long senderId) {
        Utilisateur receiver = utilisateurRepository.findById(receiverId)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable: " + receiverId));
        Utilisateur sender = utilisateurRepository.findById(senderId)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable: " + senderId));
        List<Message> unread = messageRepository.findUnreadBySenderAndReceiver(sender, receiver);
        unread.forEach(m -> m.setLu(true));
        messageRepository.saveAll(unread);
    }

    public long countUnread(Long userId) {
        Utilisateur user = utilisateurRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable: " + userId));
        return messageRepository.findUnreadByReceiver(user).size();
    }

    /** Returns for each sender: [unreadCount, lastMessage] */
    public Map<Long, Object[]> getUnreadPerContact(Long userId) {
        Utilisateur user = utilisateurRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable: " + userId));
        List<Object[]> rows = messageRepository.countUnreadBySender(user);
        Map<Long, Object[]> result = new HashMap<>();
        for (Object[] row : rows) {
            Utilisateur sender = (Utilisateur) row[0];
            Long count = (Long) row[1];
            // Get last message for this contact
            List<Message> conv = messageRepository.findConversationDesc(user, sender);
            Message last = conv.isEmpty() ? null : conv.get(0);
            result.put(sender.getId(), new Object[]{count, last});
        }
        return result;
    }

    /** Returns last message per contact (regardless of unread status) */
    public Map<Long, Message> getLastMessagePerContact(Long userId) {
        Utilisateur user = utilisateurRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable: " + userId));
        List<Utilisateur> contacts = getContacts(userId);
        Map<Long, Message> result = new HashMap<>();
        for (Utilisateur contact : contacts) {
            List<Message> conv = messageRepository.findConversationDesc(user, contact);
            if (!conv.isEmpty()) {
                result.put(contact.getId(), conv.get(0));
            }
        }
        return result;
    }

    public List<Utilisateur> getContacts(Long userId) {
        Utilisateur user = utilisateurRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable: " + userId));
        List<Utilisateur> allUsers = utilisateurRepository.findAll();
        if (user.getRole() == Role.SECRETAIRE) {
            return allUsers.stream()
                    .filter(u -> !u.getId().equals(userId))
                    .filter(u -> u.getRole() == Role.MEDECIN || u.getRole() == Role.PATIENT)
                    .sorted((a, b) -> {
                        int ra = a.getRole() == Role.PATIENT ? 0 : 1;
                        int rb = b.getRole() == Role.PATIENT ? 0 : 1;
                        if (ra != rb) return Integer.compare(ra, rb);
                        String na = (a.getNom() != null ? a.getNom() : "") + (a.getPrenom() != null ? a.getPrenom() : "");
                        String nb = (b.getNom() != null ? b.getNom() : "") + (b.getPrenom() != null ? b.getPrenom() : "");
                        return na.compareToIgnoreCase(nb);
                    })
                    .collect(Collectors.toList());
        }
        if (user.getRole() == Role.MEDECIN) {
            List<Utilisateur> secretaires = allUsers.stream()
                    .filter(u -> u.getRole() == Role.SECRETAIRE).collect(Collectors.toList());
            List<Utilisateur> patients = demandeRDVRepository.findByPraticien(user).stream()
                    .map(d -> d.getPatient()).filter(p -> p != null).distinct().collect(Collectors.toList());
            secretaires.addAll(patients);
            return secretaires;
        }
        if (user.getRole() == Role.PATIENT) {
            List<Utilisateur> secretaires = allUsers.stream()
                    .filter(u -> u.getRole() == Role.SECRETAIRE).collect(Collectors.toList());
            List<Utilisateur> medecins = demandeRDVRepository.findByPatient(user).stream()
                    .map(d -> d.getPraticien()).filter(m -> m != null).distinct().collect(Collectors.toList());
            secretaires.addAll(medecins);
            return secretaires;
        }
        return List.of();
    }
}
