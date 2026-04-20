package org.example.backend.repository;

import org.example.backend.model.Message;
import org.example.backend.model.Utilisateur;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {

    @Query("SELECT m FROM Message m WHERE (m.sender = :u1 AND m.receiver = :u2) OR (m.sender = :u2 AND m.receiver = :u1) ORDER BY m.dateEnvoi ASC")
    List<Message> findConversation(@Param("u1") Utilisateur u1, @Param("u2") Utilisateur u2);

    @Query("SELECT m FROM Message m WHERE m.receiver = :user AND m.lu = false")
    List<Message> findUnreadByReceiver(@Param("user") Utilisateur user);

    @Query("SELECT m FROM Message m WHERE m.receiver = :user AND m.sender = :sender AND m.lu = false")
    List<Message> findUnreadBySenderAndReceiver(@Param("sender") Utilisateur sender, @Param("user") Utilisateur user);

    @Query("SELECT DISTINCT CASE WHEN m.sender = :user THEN m.receiver ELSE m.sender END FROM Message m WHERE m.sender = :user OR m.receiver = :user")
    List<Utilisateur> findContactsWithConversation(@Param("user") Utilisateur user);

    @Query("SELECT m FROM Message m WHERE (m.sender = :u1 AND m.receiver = :u2) OR (m.sender = :u2 AND m.receiver = :u1) ORDER BY m.dateEnvoi DESC")
    List<Message> findConversationDesc(@Param("u1") Utilisateur u1, @Param("u2") Utilisateur u2);

    @Query("SELECT m.sender, COUNT(m) FROM Message m WHERE m.receiver = :user AND m.lu = false GROUP BY m.sender")
    List<Object[]> countUnreadBySender(@Param("user") Utilisateur user);
}
