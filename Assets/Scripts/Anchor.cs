using UnityEngine;

public class Anchor : MonoBehaviour
{
    public Vector2 Pos => transform.position;

    public static Anchor FindNearest(Vector2 pos, float radius)
    {
        Anchor best = null; float bestD = radius;
        foreach (var a in FindObjectsOfType<Anchor>())
        {
            float d = Vector2.Distance(a.Pos, pos);
            if (d <= bestD) { bestD = d; best = a; }
        }
        return best;
    }

    void OnDrawGizmos()
    {
        Gizmos.color = Color.cyan;
        Gizmos.DrawWireSphere(transform.position, 0.15f);
    }
}