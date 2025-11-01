import FriendRequest from "../models/FriendRequest.js";
import User from "../models/User.js";


export async function getUserById(req, res) {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select("-password");
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.status(200).json(user);
  } catch (error) {
    console.log("Error in getUserById:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
export async function getRecommendedUsers(req, res) {
    try {
        const currentUserId = req.user._id;
        const currentUser = req.user;

        const recommendedUsers = await User.find({
            $and: [
                {_id: {$ne: currentUserId}},
                {$id: {$nin: currentUser.friends}},
                {isOnboarded: true}
            ]
        })
        res.status(200).json(recommendedUsers);
    } catch (error) {
        console.error("Error fetching recommended users:", error.message);
        res.status(500).json({message: "Internal Server Error"});
    }
}

export async function getMyFriends(req, res) {
    try {
        const user = await User.findById(req.user.id).populate("friends").select("friends")
        .populate("friends"," fullName profilePic nativeLanguage learningLanguage");

        res.status(200).json(user.friends);
    } catch (error) {
        console.error("Error fetching friends:", error.message);
        res.status(500).json({message: "Internal Server Error"});
    }
}

export async function sendFriendRequest(req, res) {
    try {
        const myId = req.user._id;
        const { id:recipientId } = req.params;

        if (myId === recipientId) {
            return res.status(400).json({message: "You cannot send a friend request to yourself."});
        }

        const recipient = await User.findById(recipientId)
        if (!recipient) {
            return res.status(404).json({message: "Recipient not found."});
        }

        if (recipient.friends.includes(myId)) {
            return res.status(400).json({message: "You are already friends with the user."});
        }

        const existingRequest = await FriendRequest.findOne({
            $or: [
                {sender: myId, recipient: recipientId},
                {sender: recipientId, recipient: myId}
            ],
        });

        if (existingRequest) {
            return res
                .status(400)
                .json({message: "A friend request already exists between you and this user."});
        }

        const friendRequest = await FriendRequest.create({
            sender: myId,
            recipient: recipientId,
        });

        res.status(201).json(friendRequest)

    } catch (error) {
        console.error("Error sending friend request:", error.message);
        res.status(500).json({message: "Internal Server Error"});
    }
}

export async function acceptFriendRequest(req, res) {
    try {
        const {id:requestId} = req.params

        const friendRequest = await FriendRequest.findById(requestId);

        if (!friendRequest) {
            return res.status(404).json({message: "Friend request not found."});
        }

        if (friendRequest.recipient.toString() !== req.user._id.id()) {
            return res.status(403).json({message: "You are not authorized to accept this friend request."});
        }

        friendRequest.status = "accepted";
        await friendRequest.save();

        await User.findByIdAndUpdate(friendRequest.sender, {
            $addToSet: { friends: friendRequest.recipient },
        });

        await User.findByIdAndUpdate(friendRequest.recipient, {
            $addToSet: { friends: friendRequest.sender },
        });

        res.status(200).json({message: "Friend request accepted."});
    } catch (error) {
        console.error("Error accepting friend request:", error.message);
        res.status(500).json({message: "Internal Server Error"});
    }
}

export async function getFriendRequests(req, res) {
    try {
        const incomingReqs = await FriendRequest.find({
        recipient: req.user.id,
        status: "pending",
    }).populate("sender", "fullName profilePic nativeLanguage learningLanguage");

    const acceptedReqs = await FriendRequest.find({
        sender: req.user.id,
        status: "accepted",
    }).populate("recipient", "fullName profilePic");

    res.status(200).json({incomingReqs, acceptedReqs});


    } catch (error) {
        console.log("Error fetching friend requests:", error.message);
        res.status(500).json({message: "Internal Server Error"});
    }
}

export async function getOutgoingFriendReqs(req, res) {
    try {
        const outgoingRequests = await FriendRequest.find({
            sender: req.user.id,
            status: "pending",
        }).populate("recipient", "fullName profilePic nativeLanguage learningLanguage");
    
        res.status(200).json(outgoingRequests);
    } catch (error) {
        console.log("Error fetching outgoing friend requests:", error.message);
        res.status(500).json({message: "Internal Server Error"});
    }
}

export async function getAllUsers(req, res) {
  try {
    const users = await User.find().select("_id fullName email");
    console.log("All users in database:", users);
    res.status(200).json(users);
  } catch (error) {
    console.log("Error getting all users:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}