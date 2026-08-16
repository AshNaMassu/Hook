using UnityEngine;

public class TestSpawner : MonoBehaviour
{
    public Profile profile;
    public GameObject anchorPrefab;
    public Transform hero;

    System.Random rng = new System.Random(42);
    Vector2 lastPos;
    int side = 1;

    void Start() { lastPos = (Vector2)hero.position + Vector2.up * 3f; Spawn(); }

    void Update() { if (hero.position.y > lastPos.y - 12f) Spawn(); }

    void Spawn()
    {
        for (int i = 0; i < 5; i++)
        {
            side = -side;
            lastPos = Reachability.PlaceNext(lastPos, side, 0f, rng, profile);
            lastPos.x = Mathf.Clamp(lastPos.x, -4f, 4f);
            Instantiate(anchorPrefab, lastPos, Quaternion.identity);
        }
    }
}