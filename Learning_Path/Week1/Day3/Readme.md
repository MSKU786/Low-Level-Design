Core Idea: If S is a subtype of T, you should be able to replace every occurrence of T with S and the program should still behave correctly. The subclass must honor every promise the parent class makes - not just the matching signatures but the behavioural contracts as well.

X Common Misunderstanding: "LSP just means a subclass should implement all the parent methods" No -- TypeScript already enforces that at compile time. LSP is about behaviour, not just signatures.

Connection to Day 2 => OCP depends on LSP: The whole strategy pattern works because we trust that every ShippingStrategy is a proper shipping strategy. If one simply returns 0 or throws an error for valid input, the open/closed principle falls apart.
